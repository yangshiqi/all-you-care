import { describe, it, expect } from 'vitest';
import { cosineSimilarity } from '../../src/lib/embedding.js';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    const v = [1, 2, 3, 4, 5];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 10);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0, 10);
  });

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [-1, -2, -3])).toBeCloseTo(-1.0, 10);
  });

  it('returns correct value for known vectors', () => {
    // cos([1,2,3], [4,5,6]) = 32 / (sqrt(14) * sqrt(77)) ≈ 0.9746
    const sim = cosineSimilarity([1, 2, 3], [4, 5, 6]);
    expect(sim).toBeCloseTo(0.9746, 3);
  });

  it('is commutative', () => {
    const a = [0.5, -0.3, 0.8, 0.1];
    const b = [0.2, 0.7, -0.1, 0.4];
    expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a), 10);
  });

  it('handles high-dimensional vectors (3072-dim like Gemini)', () => {
    const a = Array.from({ length: 3072 }, (_, i) => Math.sin(i));
    const b = Array.from({ length: 3072 }, (_, i) => Math.sin(i + 0.1));
    const sim = cosineSimilarity(a, b);
    expect(sim).toBeGreaterThan(0.99);
    expect(sim).toBeLessThan(1.0);
  });
});
