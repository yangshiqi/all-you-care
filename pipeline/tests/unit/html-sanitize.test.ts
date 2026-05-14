import { describe, it, expect } from 'vitest';
import { sanitizeIssueHtml } from '../../src/lib/sanitize.js';

describe('sanitizeIssueHtml', () => {
  it('keeps allowed tags + attrs', () => {
    const html = '<div class="container"><h3>x</h3><a href="https://a.com">y</a><img src="https://a.com/i.jpg" alt="z"></div>';
    const out = sanitizeIssueHtml(html);
    // sanitize-html normalizes void elements to self-closing (`<img ... />`),
    // so check semantic equality of allowed tags + attrs rather than verbatim.
    expect(out).toMatch(/<div class="container">/);
    expect(out).toMatch(/<h3>x<\/h3>/);
    expect(out).toMatch(/<a href="https:\/\/a\.com">y<\/a>/);
    expect(out).toMatch(/<img\s+src="https:\/\/a\.com\/i\.jpg"\s+alt="z"\s*\/?>/);
    expect(out).toMatch(/<\/div>/);
  });
  it('strips <script>', () => {
    expect(sanitizeIssueHtml('<p>safe</p><script>alert(1)</script>')).toBe('<p>safe</p>');
  });
  it('strips javascript: hrefs', () => {
    const out = sanitizeIssueHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toMatch(/javascript:/);
  });
  it('strips data: src on img', () => {
    const out = sanitizeIssueHtml('<img src="data:text/html;base64,PHNjcmlwdD4=">');
    expect(out).not.toMatch(/data:/);
  });
  it('strips on* event handlers', () => {
    const out = sanitizeIssueHtml('<a href="https://a.com" onclick="evil()">x</a>');
    expect(out).not.toMatch(/onclick/);
  });
  it('strips <iframe>', () => {
    const out = sanitizeIssueHtml('<iframe src="https://x.com"></iframe>');
    expect(out).not.toMatch(/iframe/);
  });
});
