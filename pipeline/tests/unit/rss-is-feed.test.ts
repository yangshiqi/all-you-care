import { describe, it, expect } from 'vitest';
import { isProbablyFeed } from '../../src/lib/rss.js';

const RSS = '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel/></rss>';

describe('isProbablyFeed', () => {
  it('accepts an XML declaration', () => {
    expect(isProbablyFeed('application/rss+xml; charset=UTF-8', RSS)).toBe(true);
  });

  it('accepts rss/atom/rdf roots without a declaration', () => {
    expect(isProbablyFeed('text/xml', '<rss version="2.0"></rss>')).toBe(true);
    expect(isProbablyFeed('application/atom+xml', '<feed xmlns="..."></feed>')).toBe(true);
    expect(isProbablyFeed(null, '<rdf:RDF xmlns="..."></rdf:RDF>')).toBe(true);
  });

  it('tolerates leading whitespace', () => {
    expect(isProbablyFeed('text/xml', `\n  ${RSS}`)).toBe(true);
  });

  it('rejects an HTML anti-bot page served with 200', () => {
    // What 36kr.com/feed actually returns: 17KB of challenge page. sax used to
    // report this as "Invalid character in entity name" against inline CSS.
    const html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<style>* { box-sizing: border-box; }</style>';
    expect(isProbablyFeed('text/html', html)).toBe(false);
  });

  it('rejects HTML even when the content type lies about being XML', () => {
    expect(isProbablyFeed('application/xml', '<!DOCTYPE html><html></html>')).toBe(false);
  });

  it('rejects an empty body', () => {
    expect(isProbablyFeed('application/rss+xml', '')).toBe(false);
  });
});
