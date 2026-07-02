import { describe, it, expect } from 'vitest';
import { withinDays, dedupInfraItems, bucketAndSelect } from '../../src/steps/infraMerge.js';
import type { InfraScoredItem } from '../../src/lib/infraTypes.js';

const mk = (o: Partial<InfraScoredItem> & { title: string; category: InfraScoredItem['category']; score: number }): InfraScoredItem =>
  ({ facts: '', sources: [], ...o });

describe('withinDays', () => {
  const now = new Date('2026-07-01T00:00:00Z');
  it('true within window', () => expect(withinDays('2026-06-28T00:00:00Z', now, 7)).toBe(true));
  it('false outside window', () => expect(withinDays('2026-06-20T00:00:00Z', now, 7)).toBe(false));
  it('false on unparseable date', () => expect(withinDays('nope', now, 7)).toBe(false));
});

describe('dedupInfraItems', () => {
  it('merges same-title items, keeps higher score, unions sources', () => {
    const out = dedupInfraItems([
      mk({ title: 'Kueue v0.18.2 发布', category: 'k8s', score: 7, sources: [{ label: 'a', url: 'u1' }] }),
      mk({ title: 'Kueue v0.18.2 发布', category: 'k8s', score: 9, sources: [{ label: 'b', url: 'u2' }] }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.score).toBe(9);
    expect(out[0]!.sources.map(s => s.url).sort()).toEqual(['u1', 'u2']);
  });
  it('keeps distinct titles', () => {
    expect(dedupInfraItems([
      mk({ title: 'vLLM v0.24', category: 'ai_native', score: 8 }),
      mk({ title: 'Volcano v1.14.3', category: 'k8s', score: 8 }),
    ])).toHaveLength(2);
  });
  it('merges fuzzy-equal titles that are not normalize-identical (word-order swap)', () => {
    // normalizeTitle('美中讨论AI安全护栏') !== normalizeTitle('中美讨论AI安全护栏')
    // (leading "美中"/"中美" swap survives normalizeTitle verbatim), but
    // fuzzyEquivalent() treats them as the same event — this exercises the
    // `|| fuzzyEquivalent(...)` branch in dedupInfraItems, not the exact-match one.
    const out = dedupInfraItems([
      mk({ title: '美中讨论AI安全护栏', category: 'ai_native', score: 6, sources: [{ label: 'a', url: 'u1' }] }),
      mk({ title: '中美讨论AI安全护栏', category: 'ai_native', score: 8, sources: [{ label: 'b', url: 'u2' }] }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.score).toBe(8);
    expect(out[0]!.sources.map(s => s.url).sort()).toEqual(['u1', 'u2']);
  });
  it('keeps the longer (richer) facts string when merging same-title items', () => {
    const richerFacts = 'a much longer and richer fact description with more detail';
    const out = dedupInfraItems([
      mk({ title: 'Kueue v0.18.2 发布', category: 'k8s', score: 6, facts: 'short fact' }),
      mk({ title: 'Kueue v0.18.2 发布', category: 'k8s', score: 9, facts: richerFacts }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.facts).toBe(richerFacts);
    expect(out[0]!.score).toBe(9);
  });
});

describe('bucketAndSelect', () => {
  const items: InfraScoredItem[] = [
    mk({ title: 'a', category: 'k8s', score: 6 }),
    mk({ title: 'b', category: 'k8s', score: 9 }),
    mk({ title: 'c', category: 'k8s', score: 7 }),
    mk({ title: 'd', category: 'ai_native', score: 8 }),
  ];
  it('returns all 5 categories in fixed order', () => {
    const g = bucketAndSelect(items, 2);
    expect(g.map(x => x.key)).toEqual(['k8s', 'mesh_obs', 'serverless_storage', 'inference_engine', 'ai_native']);
  });
  it('sorts by score desc and caps per category', () => {
    const g = bucketAndSelect(items, 2);
    const k8s = g.find(x => x.key === 'k8s')!;
    expect(k8s.items.map(i => i.title)).toEqual(['b', 'c']); // 9,7 kept; 6 dropped
    expect(k8s.empty).toBe(false);
  });
  it('marks empty categories', () => {
    const g = bucketAndSelect(items, 2);
    expect(g.find(x => x.key === 'serverless_storage')!.empty).toBe(true);
    expect(g.find(x => x.key === 'serverless_storage')!.items).toEqual([]);
  });
});
