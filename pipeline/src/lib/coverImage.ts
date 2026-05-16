import type { SupabaseClient } from '@supabase/supabase-js';
import { shanghaiYearMonth } from './time.js';
import type { Channel } from './db.js';
import type { ChannelConfig } from '../channels/types.js';
import type { Logger } from './log.js';

export interface CoverPick {
  url: string;
  description: string | null; // populated only when source = reuters_pool
  link: string | null;
}

export function pickCdnUrl(
  pattern: string,
  randomMax: number,
  now: Date,
  rand: () => number = Math.random,
): string {
  const ym = shanghaiYearMonth(now);
  const n = Math.min(randomMax - 1, Math.max(0, Math.floor(rand() * randomMax)));
  return pattern.replace('{yyyymm}', ym).replace('{n}', String(n));
}

export async function pickCoverImage(
  db: SupabaseClient,
  config: ChannelConfig,
  channel: Channel,
  log: Logger,
  now: Date = new Date(),
): Promise<CoverPick> {
  // 1. Reuters pool (only if prefer=reuters_pool)
  if (config.cover_image.prefer === 'reuters_pool') {
    const { data, error } = await db.from('cover_images')
      .select('id, image_url, description, link, used_count')
      .eq('channel', channel)
      .order('used_count', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(1);
    if (!error && data && data[0]) {
      const row = data[0];
      await db.from('cover_images').update({ used_count: (row.used_count ?? 0) + 1 } as never).eq('id', row.id);
      log.debug({ event: 'cover', source: 'reuters_pool', url: row.image_url }, '');
      return {
        url: row.image_url,
        description: row.description ?? null,
        link: row.link ?? null,
      };
    }
    log.debug({ event: 'cover_fallback', from: 'reuters_pool', reason: error?.message ?? 'empty' }, '');
  }

  // 2. CDN convention (HEAD probe)
  const cdnUrl = pickCdnUrl(config.cover_image.cdn_pattern, config.cover_image.cdn_random_max, now);
  try {
    const resp = await fetch(cdnUrl, { method: 'HEAD', signal: AbortSignal.timeout(5_000) });
    if (resp.ok) {
      log.debug({ event: 'cover', source: 'cdn', url: cdnUrl }, '');
      return { url: cdnUrl, description: null, link: null };
    }
  } catch (e) {
    log.debug({ event: 'cover_fallback', from: 'cdn', err: (e as Error).message }, '');
  }

  // 3. default
  log.debug({ event: 'cover', source: 'default', url: config.cover_image.default }, '');
  return { url: config.cover_image.default, description: null, link: null };
}
