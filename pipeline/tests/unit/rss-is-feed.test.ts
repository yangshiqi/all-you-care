import { describe, it, expect } from 'vitest';
import { isProbablyFeed } from '../../src/lib/rss.js';

const RSS = '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel/></rss>';

describe('isProbablyFeed', () => {
  it('accepts an XML declaration followed by a feed root', () => {
    expect(isProbablyFeed(RSS)).toBe(true);
  });

  it('accepts rss/atom/rdf roots without a declaration', () => {
    expect(isProbablyFeed('<rss version="2.0"></rss>')).toBe(true);
    expect(isProbablyFeed('<feed xmlns="..."></feed>')).toBe(true);
    expect(isProbablyFeed('<rdf:RDF xmlns="..."></rdf:RDF>')).toBe(true);
  });

  it('tolerates leading whitespace', () => {
    expect(isProbablyFeed(`\n  ${RSS}`)).toBe(true);
  });

  it('accepts a real feed served as text/html', () => {
    // krebsonsecurity.com does exactly this. Judging by the content-type header
    // would drop a feed that works today, so only the body gets a vote.
    expect(isProbablyFeed(RSS)).toBe(true);
  });

  it('rejects an HTML anti-bot page served with 200', () => {
    // What 36kr.com/feed actually returns: 17KB of challenge page. sax used to
    // report this as "Invalid character in entity name" against inline CSS.
    const html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<style>* { box-sizing: border-box; }</style>';
    expect(isProbablyFeed(html)).toBe(false);
  });

  it('rejects XHTML — a declaration alone does not make it a feed', () => {
    const xhtml = '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n<html><body>nope</body></html>';
    expect(isProbablyFeed(xhtml)).toBe(false);
  });

  it('rejects a bare XML declaration', () => {
    expect(isProbablyFeed('<?xml version="1.0"?>')).toBe(false);
  });

  it('rejects an empty body', () => {
    expect(isProbablyFeed('')).toBe(false);
  });

  it('accepts a feed behind a stylesheet PI', () => {
    // WordPress and friends ship this ahead of the root element routinely —
    // rejecting it would take out feeds that work today.
    const body = '<?xml version="1.0"?>\n<?xml-stylesheet type="text/xsl" href="/feed.xsl"?>\n<rss version="2.0"></rss>';
    expect(isProbablyFeed(body)).toBe(true);
  });

  it('accepts a feed behind a comment', () => {
    expect(isProbablyFeed('<?xml version="1.0"?>\n<!-- generated -->\n<feed></feed>')).toBe(true);
  });
});
