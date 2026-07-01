import { describe, it, expect } from 'vitest';
import { parseInfraScoredItems } from '../../src/lib/infraTypes.js';

describe('parseInfraScoredItems', () => {
  it('parses a valid array', () => {
    const json = JSON.stringify([
      { title: 'Kueue v0.18.2', category: 'k8s', facts: 'fix DRA', score: 8.2, kind: '实时',
        sources: [{ label: 'rel', url: 'https://x/y' }] },
    ]);
    const out = parseInfraScoredItems(json);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ title: 'Kueue v0.18.2', category: 'k8s', score: 8.2, kind: '实时' });
    expect(out[0]!.sources[0]).toEqual({ label: 'rel', url: 'https://x/y' });
  });
  it('returns [] on non-JSON', () => {
    expect(parseInfraScoredItems('not json')).toEqual([]);
  });
  it('returns [] when top-level is not an array', () => {
    expect(parseInfraScoredItems('{"a":1}')).toEqual([]);
  });
  it('skips items with bad/missing category or title', () => {
    const json = JSON.stringify([
      { title: 'ok', category: 'k8s', facts: 'f', score: 5, sources: [] },
      { title: 'bad cat', category: 'nope', facts: 'f', score: 5, sources: [] },
      { category: 'k8s', facts: 'no title', score: 5, sources: [] },
    ]);
    expect(parseInfraScoredItems(json)).toHaveLength(1);
  });
  it('coerces string score and drops sources without url', () => {
    const json = JSON.stringify([
      { title: 't', category: 'ai_native', facts: 'f', score: '7.5',
        sources: [{ label: 'a' }, { label: 'b', url: 'https://u' }] },
    ]);
    const out = parseInfraScoredItems(json);
    expect(out[0]!.score).toBe(7.5);
    expect(out[0]!.sources).toEqual([{ label: 'b', url: 'https://u' }]);
  });
  it('parses a ```json fenced array (real LLM output shape)', () => {
    const inner = JSON.stringify([{ title: 'Kueue v0.18.2', category: 'k8s', facts: 'f', score: 8, sources: [] }]);
    const fenced = '```json\n' + inner + '\n```';
    const out = parseInfraScoredItems(fenced);
    expect(out).toHaveLength(1);
    expect(out[0]!.title).toBe('Kueue v0.18.2');
  });
  it('parses a bare ``` fenced array (no json tag)', () => {
    const inner = JSON.stringify([{ title: 'T', category: 'ai_native', facts: 'f', score: 7, sources: [] }]);
    expect(parseInfraScoredItems('```\n' + inner + '\n```')).toHaveLength(1);
  });
  it('parses an array with leading prose before the [', () => {
    const inner = JSON.stringify([{ title: 'T', category: 'k8s', facts: 'f', score: 5, sources: [] }]);
    expect(parseInfraScoredItems('Here is the result:\n' + inner)).toHaveLength(1);
  });
});
