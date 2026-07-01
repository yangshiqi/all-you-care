import { normalizeTitle, fuzzyEquivalent } from '../lib/eventDedup.js';
import {
  INFRA_CATEGORY_ORDER,
  type InfraScoredItem,
  type InfraCategoryKey,
} from '../lib/infraTypes.js';

/** Row-level 7-day window proxy (scored_drafts.created_at). */
export function withinDays(iso: string, now: Date, days: number): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return now.getTime() - t <= days * 86_400_000;
}

function unionSources(
  a: InfraScoredItem['sources'],
  b: InfraScoredItem['sources'],
): InfraScoredItem['sources'] {
  const seen = new Set(a.map((s) => s.url));
  const out = [...a];
  for (const s of b) if (!seen.has(s.url)) { seen.add(s.url); out.push(s); }
  return out;
}

/** Merge items with equal/fuzzy-equal titles: keep higher score + richer facts, union sources. */
export function dedupInfraItems(items: InfraScoredItem[]): InfraScoredItem[] {
  const kept: InfraScoredItem[] = [];
  for (const it of items) {
    const norm = normalizeTitle(it.title);
    const hit = kept.find(
      (k) => normalizeTitle(k.title) === norm || fuzzyEquivalent(k.title, it.title),
    );
    if (!hit) { kept.push({ ...it, sources: [...it.sources] }); continue; }
    if (it.score > hit.score) hit.score = it.score;
    if (it.facts.length > hit.facts.length) hit.facts = it.facts;
    hit.sources = unionSources(hit.sources, it.sources);
  }
  return kept;
}

export interface InfraBucket {
  key: InfraCategoryKey;
  label: string;
  empty: boolean;
  items: InfraScoredItem[];
}

/** Group into the 5 fixed categories, score-desc within each, capped at perCategoryMax. */
export function bucketAndSelect(items: InfraScoredItem[], perCategoryMax: number): InfraBucket[] {
  return INFRA_CATEGORY_ORDER.map(({ key, label }) => {
    const picked = items
      .filter((i) => i.category === key)
      .sort((a, b) => b.score - a.score)
      .slice(0, perCategoryMax);
    return { key, label, empty: picked.length === 0, items: picked };
  });
}
