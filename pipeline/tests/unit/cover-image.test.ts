import { describe, it, expect } from 'vitest';
import { pickCdnUrl, pickCoverImage } from '../../src/lib/coverImage.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChannelConfig } from '../../src/channels/types.js';

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

describe('pickCoverImage (reuters_pool: today-or-default)', () => {
  const config = {
    cover_image: {
      prefer: 'reuters_pool',
      cdn_pattern: '',
      cdn_random_max: 1,
      default: '/ainews/default.jpg',
    },
  } as unknown as ChannelConfig;
  const log = { debug() {}, info() {}, warn() {}, error() {} } as never;

  // Minimal Supabase query-builder stub: .select().eq().order().limit() resolves
  // to { data, error }. The reuters branch awaits the result of .limit(1).
  function fakeDb(row: unknown | null, error: { message: string } | null = null) {
    const b = {
      select: () => b,
      eq: () => b,
      order: () => b,
      limit: () => Promise.resolve({ data: row ? [row] : [], error }),
    };
    return { from: () => b } as unknown as SupabaseClient;
  }

  // 08:30 SH on 2026-06-02 (= 00:30 UTC), the moment merge runs.
  const now = new Date('2026-06-02T00:30:00Z');

  it("uses today's image (07:00 SH = previous UTC day still counts)", async () => {
    const db = fakeDb({
      image_url: 'https://r/today.jpg',
      description: 'desc',
      link: 'https://r/a',
      created_at: '2026-06-01T23:00:00Z', // 07:00 SH on 06-02
    });
    const pick = await pickCoverImage(db, config, 'ai', log, now);
    expect(pick).toEqual({ url: 'https://r/today.jpg', description: 'desc', link: 'https://r/a' });
  });

  it('falls back to default when the latest image is stale (not today)', async () => {
    const db = fakeDb({
      image_url: 'https://r/old.jpg',
      description: 'old',
      link: 'https://r/old',
      created_at: '2026-05-30T23:00:00Z', // 05-31 SH — stale
    });
    const pick = await pickCoverImage(db, config, 'ai', log, now);
    expect(pick).toEqual({ url: '/ainews/default.jpg', description: null, link: null });
  });

  it('falls back to default when the pool is empty', async () => {
    const pick = await pickCoverImage(fakeDb(null), config, 'ai', log, now);
    expect(pick.url).toBe('/ainews/default.jpg');
  });

  it('falls back to default on query error', async () => {
    const pick = await pickCoverImage(fakeDb(null, { message: 'boom' }), config, 'ai', log, now);
    expect(pick.url).toBe('/ainews/default.jpg');
  });
});
