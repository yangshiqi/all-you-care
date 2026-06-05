import { describe, it, expect } from 'vitest';
import { toPersonaTags } from '../../src/lib/persona.js';

// Regression for the 2026-06-05 morning-email outage:
// the Anthropic proxy returned 400 ("plain HTTP request was sent to HTTPS
// port"), the LLM chain fell back to Gemini, and Gemini returned a bare string
// ("engineer") where merge.ts expected Persona[]. The merge step then crashed
// with "tags.find is not a function", the whole publish-pipeline failed, and the
// deliver step (the email) was skipped. toPersonaTags() normalizes whatever the
// LLM returns into an array so .find()/.length downstream can never throw.
describe('toPersonaTags', () => {
  it('passes a well-formed array through unchanged', () => {
    expect(toPersonaTags(['engineer', 'investor'])).toEqual(['engineer', 'investor']);
  });

  it('wraps a bare string (the Gemini fallback shape that broke merge) into an array', () => {
    const tags = toPersonaTags('engineer');
    expect(tags).toEqual(['engineer']);
    // The exact call that used to throw "tags.find is not a function":
    expect(() => tags.find((p) => p === 'engineer')).not.toThrow();
    expect(tags.find((p) => p === 'engineer')).toBe('engineer');
  });

  it('returns [] for null / undefined', () => {
    expect(toPersonaTags(null)).toEqual([]);
    expect(toPersonaTags(undefined)).toEqual([]);
  });

  it('returns [] for non-list, non-string junk instead of throwing', () => {
    expect(toPersonaTags(42)).toEqual([]);
    expect(toPersonaTags({ engineer: true })).toEqual([]);
  });

  it('drops non-string elements inside an array', () => {
    expect(toPersonaTags(['engineer', null, 7, 'investor'])).toEqual(['engineer', 'investor']);
  });
});
