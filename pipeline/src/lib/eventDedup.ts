// pipeline/src/lib/eventDedup.ts
//
// Pure-TS parser + dedup for "scored_drafts" markdown briefings.
// The merge step uses this to guarantee that no event is silently dropped by
// the LLM: every #### heading from the input becomes an enumerated event
// downstream, and the LLM is only asked to pick top picks + assign personas.

export interface RawEvent {
  title: string;
  description: string;
  links: string[];
  score: number;
}

export interface MergedEvent extends RawEvent {
  id: number;          // sequential id assigned after dedup (1..N)
  source_count: number; // how many duplicates were merged into this event
}

// ---- markdown parsing -----------------------------------------------------

const HEADING_RE = /^#{2,6}\s+(.+?)\s*$/;        // accept #### / ### / etc.
const ORIGINAL_RE = /^\s*\*\*\s*原文\s*\*\*\s*[:：]\s*(.*)$/;
const LINK_RE     = /^\s*\*\*\s*链接\s*\*\*\s*[:：]\s*(.*)$/;
const SCORE_RE    = /^\s*\*\*\s*热度\s*\*\*\s*[:：]\s*(.*)$/;
// Legacy field from the old scoring prompt. We don't use it, just want to
// keep it out of `description`.
const COMMENT_RE  = /^\s*\*\*\s*点评\s*\*\*\s*[:：]/;
// Match any URL inside a markdown link `[text](URL)` OR a bare http(s) URL.
const URL_IN_MD_LINK_RE = /\[[^\]]*?\]\((https?:\/\/[^)\s]+)\)/g;
const BARE_URL_RE = /(https?:\/\/[^\s)\]|]+)/g;
// Match a number 0-10 (with optional decimal) anywhere in the score line.
const SCORE_NUM_RE = /(\d+(?:\.\d+)?)/;

function extractUrls(line: string): string[] {
  const urls = new Set<string>();
  for (const m of line.matchAll(URL_IN_MD_LINK_RE)) {
    if (m[1]) urls.add(m[1].trim());
  }
  // Also catch bare URLs not wrapped in markdown link syntax.
  // Strip already-captured md-link URLs first to avoid double-adding.
  const stripped = line.replace(URL_IN_MD_LINK_RE, '');
  for (const m of stripped.matchAll(BARE_URL_RE)) {
    if (m[1]) urls.add(m[1].trim().replace(/[),.;]+$/, ''));
  }
  return Array.from(urls);
}

function parseScore(line: string): number {
  const m = SCORE_NUM_RE.exec(line);
  if (!m || m[1] === undefined) return 0;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 10) return 10;
  return n;
}

/**
 * Parse the markdown content of a single scored_draft into events.
 *
 * Each event begins with a heading line (`####` / `###` / etc.). Within the
 * block, the parser recognises three optional marker lines: `**原文**:`,
 * `**链接**:`, `**热度**:`. Lines that don't match a marker but follow the
 * heading become part of the description. Any field can be missing — those
 * fall back to safe defaults (description=''/links=[]/score=0).
 */
export function parseScoredEvents(scoredContent: string): RawEvent[] {
  const lines = scoredContent.split(/\r?\n/);
  const events: RawEvent[] = [];

  let cur: {
    title: string;
    descParts: string[];
    descFromMarker: string | null;
    links: string[];
    score: number;
  } | null = null;

  const flush = () => {
    if (!cur) return;
    const description = (cur.descFromMarker !== null
      ? [cur.descFromMarker, ...cur.descParts].filter(Boolean).join(' ')
      : cur.descParts.join(' ')
    ).replace(/\s+/g, ' ').trim();
    events.push({
      title: cur.title,
      description,
      links: cur.links,
      score: cur.score,
    });
    cur = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/　/g, ' '); // normalise full-width space
    const headingMatch = HEADING_RE.exec(line);
    if (headingMatch && headingMatch[1] !== undefined) {
      flush();
      cur = {
        title: headingMatch[1].trim(),
        descParts: [],
        descFromMarker: null,
        links: [],
        score: 0,
      };
      continue;
    }
    if (!cur) continue;
    const o = ORIGINAL_RE.exec(line);
    if (o && o[1] !== undefined) {
      cur.descFromMarker = o[1].trim();
      continue;
    }
    const l = LINK_RE.exec(line);
    if (l && l[1] !== undefined) {
      const urls = extractUrls(l[1]);
      for (const u of urls) {
        if (!cur.links.includes(u)) cur.links.push(u);
      }
      continue;
    }
    const s = SCORE_RE.exec(line);
    if (s && s[1] !== undefined) {
      cur.score = parseScore(s[1]);
      continue;
    }
    if (COMMENT_RE.test(line)) continue; // legacy 点评 marker — discard
    // a non-marker line — append to description if non-empty
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      cur.descParts.push(trimmed);
    }
  }
  flush();
  return events;
}

// ---- title normalisation --------------------------------------------------

const SUMMARY_SUFFIX_RE = /[（(]\s*(?:总结|回顾|总结\/回顾|回顾\/总结|总结回顾)\s*[)）]\s*$/;

/**
 * Normalise a title for dedup comparison:
 *  - strip a trailing "（总结/回顾）" / "（总结）" / "（回顾）" marker
 *  - trim & collapse whitespace
 *  - lowercase ASCII letters (CJK passes through unchanged)
 *  - drop trailing punctuation that is incidental to the headline
 */
export function normalizeTitle(title: string): string {
  let t = title.normalize('NFKC');
  // Strip leading enumeration like "1." / "1、" / "①"
  t = t.replace(/^\s*(?:\d+[.．、)）]|[①-⑩])\s*/, '');
  t = t.replace(SUMMARY_SUFFIX_RE, '');
  t = t.replace(/\s+/g, ' ').trim();
  // lowercase ASCII; CJK is unaffected by toLowerCase
  t = t.toLowerCase();
  // drop trailing terminal punctuation
  t = t.replace(/[.,!?。！？、，：:；;\s]+$/u, '');
  return t;
}

// ---- fuzzy title equivalence ---------------------------------------------

// Two titles can be near-duplicates even when normalizeTitle() differs (e.g.
// "美中讨论..." vs "中美讨论...安全护栏"). We add a guarded fuzzy match:
//   1. all latin/digit tokens must be a perfect multiset match
//      → blocks "GPT-5" vs "GPT-6", "Llama 3" vs "Llama 4", "Pro" vs "Pro Max"
//   2. char-set Jaccard ≥ FUZZY_CHARSET_THRESHOLD (coarse similarity gate)
//   3. char-bigram Jaccard ≥ FUZZY_BIGRAM_THRESHOLD (order-aware final gate)

const FUZZY_CHARSET_THRESHOLD = 0.65;
const FUZZY_BIGRAM_THRESHOLD  = 0.35;
const LATIN_TOKEN_RE = /[a-z][a-z0-9.\-]*|\d[a-z0-9.\-]*/g;

function normalizeForFuzzy(title: string): string {
  let t = title.normalize('NFKC');
  t = t.replace(/^\s*(?:\d+[.．、)）]|[①-⑩])\s*/, '');
  t = t.replace(SUMMARY_SUFFIX_RE, '');
  t = t.toLowerCase();
  // keep CJK Unified Ideographs + ASCII alnum + `.` + `-`; drop everything else
  t = t.replace(/[^一-鿿a-z0-9.\-]/g, '');
  return t;
}

function extractLatinTokens(normalized: string): string[] {
  const out: string[] = [];
  for (const m of normalized.matchAll(LATIN_TOKEN_RE)) out.push(m[0]);
  return out.sort();
}

function multisetEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function charSet(s: string): Set<string> {
  return new Set(s);
}

function bigramSet(s: string): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i + 1 < s.length; i++) out.add(s.slice(i, i + 2));
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export function fuzzyEquivalent(titleA: string, titleB: string): boolean {
  const a = normalizeForFuzzy(titleA);
  const b = normalizeForFuzzy(titleB);
  if (a.length === 0 || b.length === 0) return false;
  if (!multisetEqual(extractLatinTokens(a), extractLatinTokens(b))) return false;
  if (jaccard(charSet(a), charSet(b)) < FUZZY_CHARSET_THRESHOLD) return false;
  if (jaccard(bigramSet(a), bigramSet(b)) < FUZZY_BIGRAM_THRESHOLD) return false;
  return true;
}

// ---- dedup ----------------------------------------------------------------

/**
 * Two events are considered duplicates when:
 *  - their normalised titles match, OR
 *  - they share at least one URL.
 *
 * When duplicates are merged, we keep the highest score, the longest
 * description, and the union of links. Events are returned with sequential
 * 1..N ids.
 */
export function deduplicateEvents(events: RawEvent[]): MergedEvent[] {
  interface Bucket {
    titleKey: string;
    title: string;
    description: string;
    links: string[];
    score: number;
    source_count: number;
  }
  const buckets: Bucket[] = [];
  const titleIdx = new Map<string, number>();
  const urlIdx = new Map<string, number>();

  function mergeInto(b: Bucket, bIdx: number, e: RawEvent) {
    b.source_count += 1;
    if (e.score > b.score) b.score = e.score;
    if (e.description.length > b.description.length) {
      b.description = e.description;
    }
    for (const u of e.links) {
      if (!b.links.includes(u)) b.links.push(u);
    }
    for (const u of b.links) {
      if (!urlIdx.has(u)) urlIdx.set(u, bIdx);
    }
  }

  for (const e of events) {
    const key = normalizeTitle(e.title);
    let target: number | undefined = key.length > 0 ? titleIdx.get(key) : undefined;
    if (target === undefined) {
      for (const u of e.links) {
        const hit = urlIdx.get(u);
        if (hit !== undefined) {
          target = hit;
          break;
        }
      }
    }
    if (target === undefined) {
      // Fuzzy fallback: scan existing buckets for a near-duplicate title.
      for (let i = 0; i < buckets.length; i++) {
        const b = buckets[i];
        if (b && fuzzyEquivalent(e.title, b.title)) {
          target = i;
          break;
        }
      }
    }
    if (target !== undefined) {
      const b = buckets[target];
      if (b) {
        mergeInto(b, target, e);
        if (key.length > 0 && !titleIdx.has(key)) titleIdx.set(key, target);
        continue;
      }
    }
    const b: Bucket = {
      titleKey: key,
      title: e.title,
      description: e.description,
      links: [...e.links],
      score: e.score,
      source_count: 1,
    };
    buckets.push(b);
    const idx = buckets.length - 1;
    if (key.length > 0) titleIdx.set(key, idx);
    for (const u of e.links) {
      if (!urlIdx.has(u)) urlIdx.set(u, idx);
    }
  }

  return buckets.map((b, i) => ({
    id: i + 1,
    title: b.title,
    description: b.description,
    links: b.links,
    score: b.score,
    source_count: b.source_count,
  }));
}
