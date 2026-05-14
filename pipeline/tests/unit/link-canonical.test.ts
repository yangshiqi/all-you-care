import { describe, it, expect } from 'vitest';
import { canonicalizeLink } from '../../src/lib/linkCanonical.js';

describe('canonicalizeLink', () => {
  it('returns input when not a URL', () => {
    expect(canonicalizeLink('not a url')).toBe('not a url');
  });
  it('strips utm_*', () => {
    expect(canonicalizeLink('https://x.com/a?utm_source=newsletter&keep=yes'))
      .toBe('https://x.com/a?keep=yes');
  });
  it('strips fbclid / gclid', () => {
    expect(canonicalizeLink('https://x.com/a?fbclid=123&gclid=456'))
      .toBe('https://x.com/a');
  });
  it('unwraps Google AMP cache', () => {
    expect(canonicalizeLink('https://www.google.com/amp/s/example.com/path'))
      .toBe('https://example.com/path');
  });
  it('unwraps Gmail tracking redirect', () => {
    const wrapped = 'https://email.beehiiv.com/c/eyJlIjoiZm9vIn0?u=https%3A%2F%2Freal.com%2Fpost';
    const out = canonicalizeLink(wrapped);
    expect(out).toBe('https://real.com/post');
  });
  it('lowercases host but keeps path case', () => {
    expect(canonicalizeLink('HTTPS://X.COM/AbC')).toBe('https://x.com/AbC');
  });
});
