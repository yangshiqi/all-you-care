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

// ---- description-similarity fallback -------------------------------------

// When two titles paraphrase the same event but have unequal latin-token sets
// (e.g. ChatGPT/Codex/API vs ChatGPT/Codex, or "Brockman" vs "布罗克曼"), the
// strict multiset rule misses them. We fall back to comparing descriptions:
// if both descriptions are non-trivial in length, share a strong entity anchor
// (≥ N shared latin tokens across title+description), AND their normalized
// bigram Jaccard is high, treat as duplicates.

const FUZZY_DESC_MIN_LEN = 30;
const FUZZY_DESC_MIN_SHARED_TOKENS = 3;
// Asymmetric overlap (|A∩B| / min(|A|,|B|)) lets a short summary match a long
// article when one description is a near-subset of the other. Bigram captures
// ordered phrasing; charset is order-free but stricter on shared vocabulary —
// both must clear, which gives clean separation between true paraphrases and
// unrelated stories about the same company.
const FUZZY_DESC_BIGRAM_OVERLAP_THRESHOLD = 0.25;
const FUZZY_DESC_CHARSET_OVERLAP_THRESHOLD = 0.35;

// Extract latin tokens without first running normalizeForFuzzy (which strips
// ASCII spaces and would glue "Greg Brockman" into a single "gregbrockman"
// token). For the description-similarity fallback we want true word-level
// tokens so the shared-entity-token check is meaningful.
function extractLatinTokensFromRaw(s: string): string[] {
  const lower = s.toLowerCase().normalize('NFKC');
  const out: string[] = [];
  for (const m of lower.matchAll(LATIN_TOKEN_RE)) out.push(m[0]);
  return out;
}

function combinedLatinTokenSet(title: string, description: string): Set<string> {
  const out = new Set<string>();
  for (const t of extractLatinTokensFromRaw(title)) out.add(t);
  for (const t of extractLatinTokensFromRaw(description)) out.add(t);
  return out;
}

function setIntersectionSize(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
}

function overlapCoefficient(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  return setIntersectionSize(a, b) / Math.min(a.size, b.size);
}

const VERSION_SUFFIX_RE = /^(.*?[a-z][-.]?)(\d[\d.]*)(.*)$/;

function splitVersion(token: string): { prefix: string; ver: string; suffix: string } | null {
  const m = VERSION_SUFFIX_RE.exec(token);
  if (!m || !m[1]) return null;
  return { prefix: m[1], ver: m[2] ?? '', suffix: m[3] ?? '' };
}

/**
 * Whether two titles look like different releases of the same product
 * ("GPT-5" vs "GPT-6"), which must never be merged.
 */
export function titlesConflictOnVersion(titleA: string, titleB: string): boolean {
  return hasVersionConflict(
    new Set(extractLatinTokensFromRaw(titleA)),
    new Set(extractLatinTokensFromRaw(titleB)),
  );
}

function hasVersionConflict(tokensA: Set<string>, tokensB: Set<string>): boolean {
  const uniqueA = [...tokensA].filter(t => !tokensB.has(t) && /\d/.test(t));
  const uniqueB = [...tokensB].filter(t => !tokensA.has(t) && /\d/.test(t));
  const parsedA = uniqueA.map(splitVersion).filter((v): v is { prefix: string; ver: string; suffix: string } => v !== null);
  const parsedB = uniqueB.map(splitVersion).filter((v): v is { prefix: string; ver: string; suffix: string } => v !== null);
  for (const vA of parsedA) {
    for (const vB of parsedB) {
      if (vA.prefix === vB.prefix && vA.suffix === vB.suffix && vA.ver !== vB.ver) return true;
    }
  }
  return false;
}

export function descriptionsLikelySameEvent(
  a: { title: string; description: string },
  b: { title: string; description: string },
  minSharedTokens: number = FUZZY_DESC_MIN_SHARED_TOKENS,
): boolean {
  if (!a.description || !b.description) return false;
  if (a.description.length < FUZZY_DESC_MIN_LEN) return false;
  if (b.description.length < FUZZY_DESC_MIN_LEN) return false;

  // Version guard: reject when the two titles look like different releases of
  // the same product (e.g. "GPT-4" vs "GPT-5"). We only reject when there's a
  // concrete *version pair* — two tokens that share a text prefix but differ in
  // a trailing version number. Bare numbers (prices, percentages, dates) that
  // don't pair up are harmless and should not block dedup.
  const titleTokensA = new Set(extractLatinTokensFromRaw(a.title));
  const titleTokensB = new Set(extractLatinTokensFromRaw(b.title));
  if (hasVersionConflict(titleTokensA, titleTokensB)) return false;

  const tokensA = combinedLatinTokenSet(a.title, a.description);
  const tokensB = combinedLatinTokenSet(b.title, b.description);
  if (setIntersectionSize(tokensA, tokensB) < minSharedTokens) return false;

  const nA = normalizeForFuzzy(a.description);
  const nB = normalizeForFuzzy(b.description);
  if (nA.length < 20 || nB.length < 20) return false;
  if (overlapCoefficient(bigramSet(nA), bigramSet(nB)) < FUZZY_DESC_BIGRAM_OVERLAP_THRESHOLD) return false;
  if (overlapCoefficient(charSet(nA), charSet(nB)) < FUZZY_DESC_CHARSET_OVERLAP_THRESHOLD) return false;
  return true;
}

// ---- URL as a dedup signal ------------------------------------------------

// A shared URL means a shared *source article*, which is not the same thing as
// a shared *event*. Two ways that breaks:
//
//   1. Digest articles. compress splits one roundup ("极客早知道", a newsletter
//      issue) into a dozen unrelated news items that all carry the roundup's
//      link.
//   2. Mis-attribution. compress occasionally hands an item its neighbour's
//      link.
//
// Treating the URL as identity let the first bucket holding such a link swallow
// every other story behind it: issue 135 shipped a card titled "OpenAI 第二季度
// 营收增速放缓" whose body described a HoverAir drone camera, and a neighbouring
// card silently dropped an unrelated story entirely. So a URL match now only
// *corroborates* — it still has to be backed by title or description similarity.

// A URL behind this many *distinct events* describes a container, not an event;
// it is dropped from URL matching outright. Two distinct events is the ordinary
// same-story-two-wordings case, so the floor starts at three.
const CONTAINER_URL_MIN_DISTINCT_EVENTS = 3;

// Shared-entity floor for a URL-corroborated description match. Lower than the
// standalone FUZZY_DESC_MIN_SHARED_TOKENS because the shared URL is itself
// evidence, but not zero — a lone incidental token (a year, a percentage)
// matched two unrelated quarterly-earnings stories in the issue-135 batch.
const URL_CORROBORATION_MIN_SHARED_TOKENS = 2;

/**
 * Whether the entries contain `size` that are pairwise unrelated — i.e. an
 * independent set of that size in the corroboration graph.
 *
 * Exact rather than greedy, and therefore independent of the order the entries
 * arrived in. A greedy walk is both order-dependent and defeatable: a digest
 * that also yields a broad "今日汇总" line has that line corroborate each of
 * its own children, so a first-come walk collapses the digest to one
 * representative and the URL escapes container classification — reinstating the
 * collapse this guards against. An independent set ignores such a hub, because
 * the children remain mutually unrelated.
 *
 * Exhaustive search is only tractable because `size` is a small constant and a
 * single URL carries at most a few dozen entries; raising
 * CONTAINER_URL_MIN_DISTINCT_EVENTS materially would need a different approach.
 */
function hasUnrelatedSubset(entries: readonly RawEvent[], size: number): boolean {
  const n = entries.length;
  if (size <= 0) return true;
  if (n < size) return false;
  const related: boolean[][] = Array.from({ length: n }, () => new Array<boolean>(n).fill(false));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = entries[i], b = entries[j];
      if (a && b && urlMatchCorroborated(a, b)) related[i]![j] = related[j]![i] = true;
    }
  }
  const chosen: number[] = [];
  const search = (from: number): boolean => {
    if (chosen.length === size) return true;
    // Prune: not enough entries left to reach `size`.
    if (n - from < size - chosen.length) return false;
    for (let i = from; i < n; i++) {
      if (chosen.some((c) => related[c]![i])) continue;
      chosen.push(i);
      if (search(i + 1)) return true;
      chosen.pop();
    }
    return false;
  };
  return search(0);
}

/**
 * URLs behind CONTAINER_URL_MIN_DISTINCT_EVENTS or more distinct events. These
 * identify a container article rather than an event and must not be used as
 * identity. Counting *events* rather than raw titles matters: a real article
 * reported three times under different headlines would otherwise be mistaken
 * for a digest, which disables URL corroboration and splits it into three cards.
 */
export function findContainerUrls(events: readonly RawEvent[]): Set<string> {
  const entriesByUrl = new Map<string, RawEvent[]>();
  for (const e of events) {
    for (const u of new Set(e.links)) {
      let entries = entriesByUrl.get(u);
      if (!entries) {
        entries = [];
        entriesByUrl.set(u, entries);
      }
      entries.push(e);
    }
  }
  const containers = new Set<string>();
  for (const [url, entries] of entriesByUrl) {
    if (entries.length < CONTAINER_URL_MIN_DISTINCT_EVENTS) continue; // cheap pre-filter
    if (hasUnrelatedSubset(entries, CONTAINER_URL_MIN_DISTINCT_EVENTS)) containers.add(url);
  }
  return containers;
}

/**
 * Whether a shared (non-container) URL is backed by enough title/description
 * similarity to conclude the two entries describe the same event.
 */
export function urlMatchCorroborated(
  a: { title: string; description: string },
  b: { title: string; description: string },
): boolean {
  if (normalizeTitle(a.title) === normalizeTitle(b.title)) return true;
  if (fuzzyEquivalent(a.title, b.title)) return true;
  return descriptionsLikelySameEvent(a, b, URL_CORROBORATION_MIN_SHARED_TOKENS);
}

// ---- dedup ----------------------------------------------------------------

/**
 * Two events are considered duplicates when:
 *  - their normalised titles match, OR
 *  - they share a non-container URL *and* that match is corroborated by title
 *    or description similarity, OR
 *  - their titles are fuzzy-equivalent, OR
 *  - their descriptions describe the same event.
 *
 * When duplicates are merged the links are unioned, and title, description and
 * score are all taken from a single representative event — the highest-scoring
 * one, breaking ties on description length. Mixing fields across source events
 * is what produced cards whose headline and body were about different stories.
 * Events are returned with sequential 1..N ids.
 */
export function deduplicateEvents(events: RawEvent[]): MergedEvent[] {
  interface Bucket {
    titleKey: string;
    title: string;
    description: string;
    links: string[];
    score: number;
    source_count: number;
    // Every entry merged so far. Matching runs against all of them, not just
    // the displayed winner: when a higher-scoring duplicate takes over the
    // title and description, the earlier wording must keep participating or a
    // third report matching only that wording lands in its own card.
    members: { title: string; description: string }[];
  }
  const buckets: Bucket[] = [];
  const titleIdx = new Map<string, number>();
  // URL -> every bucket carrying it. A single slot let a mis-attributed event
  // claim the URL and hide the genuine bucket behind it from later reports.
  const urlIdx = new Map<string, number[]>();
  const containerUrls = findContainerUrls(events);

  const indexUrl = (u: string, bIdx: number) => {
    if (containerUrls.has(u)) return;
    const owners = urlIdx.get(u);
    if (!owners) urlIdx.set(u, [bIdx]);
    else if (!owners.includes(bIdx)) owners.push(bIdx);
  };

  // A positive match against one member is not enough: a versionless report can
  // bridge two releases, so "GPT-5" and "GPT-6" would merge through it and the
  // version guard inside descriptionsLikelySameEvent would never see the
  // conflicting pair. Any conflicting member vetoes the whole bucket.
  const matchesBucket = (
    e: RawEvent,
    b: Bucket,
    predicate: (m: { title: string; description: string }) => boolean,
  ) => !b.members.some((m) => titlesConflictOnVersion(e.title, m.title))
    && b.members.some(predicate);

  function mergeInto(b: Bucket, bIdx: number, e: RawEvent) {
    b.source_count += 1;
    b.members.push({ title: e.title, description: e.description });
    // Title, description and score all come from whichever source event wins —
    // never title from one and description from another.
    if (
      e.score > b.score ||
      (e.score === b.score && e.description.length > b.description.length)
    ) {
      b.title = e.title;
      b.description = e.description;
      b.score = e.score;
    }
    for (const u of e.links) {
      if (!b.links.includes(u)) b.links.push(u);
    }
    for (const u of b.links) indexUrl(u, bIdx);
  }

  for (const e of events) {
    const key = normalizeTitle(e.title);
    let target: number | undefined = key.length > 0 ? titleIdx.get(key) : undefined;
    if (target === undefined) {
      for (const u of e.links) {
        if (containerUrls.has(u)) continue;
        for (const hit of urlIdx.get(u) ?? []) {
          const b = buckets[hit];
          if (b && matchesBucket(e, b, (m) => urlMatchCorroborated(
            { title: e.title, description: e.description }, m,
          ))) {
            target = hit;
            break;
          }
        }
        if (target !== undefined) break;
      }
    }
    if (target === undefined) {
      // Fuzzy fallback: scan existing buckets for a near-duplicate title.
      for (let i = 0; i < buckets.length; i++) {
        const b = buckets[i];
        if (b && matchesBucket(e, b, (m) => fuzzyEquivalent(e.title, m.title))) {
          target = i;
          break;
        }
      }
    }
    if (target === undefined) {
      // Description-similarity fallback: catches cross-source paraphrases
      // where the title's latin tokens differ (subset relationships, mixed
      // 拉丁/CJK transliteration). Gated by length + shared-entity-token
      // anchor to avoid merging unrelated stories that happen to share a
      // company name.
      for (let i = 0; i < buckets.length; i++) {
        const b = buckets[i];
        if (b && matchesBucket(e, b, (m) => descriptionsLikelySameEvent(
          { title: e.title, description: e.description }, m,
        ))) {
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
      members: [{ title: e.title, description: e.description }],
    };
    buckets.push(b);
    const idx = buckets.length - 1;
    if (key.length > 0) titleIdx.set(key, idx);
    for (const u of e.links) indexUrl(u, idx);
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
