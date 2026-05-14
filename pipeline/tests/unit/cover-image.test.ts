import { describe, it, expect } from 'vitest';
import { pickCdnUrl } from '../../src/lib/coverImage.js';

describe('pickCdnUrl', () => {
  it('substitutes {yyyymm} and random {n}', () => {
    const url = pickCdnUrl(
      'https://x.com/{yyyymm}/{n}.jpg',
      8,
      new Date('2026-05-13T12:00:00Z'),
      () => 0.5,
    );
    // 0.5 * 8 = 4
    expect(url).toBe('https://x.com/202605/4.jpg');
  });
  it('clamps random to [0, max-1]', () => {
    const url = pickCdnUrl('https://x/{n}.jpg', 4, new Date(), () => 0.9999);
    expect(url).toBe('https://x/3.jpg');
  });
});
