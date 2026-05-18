import { describe, it, expect } from 'vitest';
import { parseOpmlFeeds } from '../../src/lib/opml.js';

describe('parseOpmlFeeds', () => {
  it('extracts xmlUrl values', () => {
    const opml = `<?xml version="1.0"?>
<opml version="2.0"><body>
  <outline type="rss" xmlUrl="https://a.example/feed" />
  <outline type="rss" xmlUrl="https://b.example/rss.xml" />
</body></opml>`;
    const urls = parseOpmlFeeds(opml, 'test');
    expect(urls).toEqual(['https://a.example/feed', 'https://b.example/rss.xml']);
  });

  it('deduplicates repeats', () => {
    const opml = `<x xmlUrl="https://a.example/feed"/><y xmlUrl="https://a.example/feed"/>`;
    expect(parseOpmlFeeds(opml, 't')).toEqual(['https://a.example/feed']);
  });

  it('decodes &amp;', () => {
    const opml = `<x xmlUrl="https://a.example/feed?x=1&amp;y=2"/>`;
    expect(parseOpmlFeeds(opml, 't')).toEqual(['https://a.example/feed?x=1&y=2']);
  });

  it('returns empty for no matches', () => {
    expect(parseOpmlFeeds('<opml></opml>', 't')).toEqual([]);
  });

  it('extracts single-quoted xmlUrl', () => {
    const opml = `<outline xmlUrl='https://a.example/feed' />`;
    expect(parseOpmlFeeds(opml, 't')).toEqual(['https://a.example/feed']);
  });

  it('decodes decimal numeric entities (&#38;)', () => {
    const opml = `<x xmlUrl="https://a.example/feed?x=1&#38;y=2"/>`;
    expect(parseOpmlFeeds(opml, 't')).toEqual(['https://a.example/feed?x=1&y=2']);
  });

  it('decodes hex numeric entities (&#x26;)', () => {
    const opml = `<x xmlUrl="https://a.example/feed?x=1&#x26;y=2"/>`;
    expect(parseOpmlFeeds(opml, 't')).toEqual(['https://a.example/feed?x=1&y=2']);
  });
});
