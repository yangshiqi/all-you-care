import { describe, it, expect } from 'vitest';
import { mapRssItem } from '../../src/lib/rss.js';

describe('mapRssItem', () => {
  it('prefers contentSnippet, then content, then summary', () => {
    expect(mapRssItem({ title: 'A', contentSnippet: 'snip', content: 'html', summary: 'sum' }, 'h').content).toBe('snip');
    expect(mapRssItem({ title: 'B', content: 'html', summary: 'sum' }, 'h').content).toBe('html');
    expect(mapRssItem({ title: 'C', summary: 'sum' }, 'h').content).toBe('sum');
  });
  it('falls back to empty string when no body', () => {
    expect(mapRssItem({ title: 'D' }, 'h').content).toBe('');
  });
  it('maps link/date/guid/source', () => {
    const r = mapRssItem({ title: 'E', link: 'u', isoDate: '2026-01-01', guid: 'g' }, 'host');
    expect(r).toMatchObject({ title: 'E', link: 'u', pub_date: '2026-01-01', guid: 'g', source: 'host' });
  });
});
