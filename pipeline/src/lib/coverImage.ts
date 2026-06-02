import type { SupabaseClient } from '@supabase/supabase-js';
import { shanghaiYearMonth, todayCst } from './time.js';
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
  const fallback = (reason: string): CoverPick => {
    log.debug({ event: 'cover', source: 'default', url: config.cover_image.default, reason }, '');
    return { url: config.cover_image.default, description: null, link: null };
  };

  // Reuters path (AI channel): use *today's* freshly-extracted image, or the
  // default. No pool / recycling — reutersImage produces a new image each day,
  // and a stale image whose caption no longer matches anything is worse than a
  // neutral placeholder. "Today" is the Shanghai calendar day, which lines up
  // the 07:00 SH image with the 08:30 SH paper (the image's UTC date is the
  // previous day, so UTC comparison would wrongly reject it).
  if (config.cover_image.prefer === 'reuters_pool') {
    const { data, error } = await db.from('cover_images')
      .select('image_url, description, link, created_at')
      .eq('channel', channel)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) return fallback(`query_error:${error.message}`);
    const row = data?.[0];
    if (!row) return fallback('empty');
    const today = todayCst(now).date;
    const rowDay = todayCst(new Date(row.created_at)).date;
    if (rowDay !== today) return fallback(`stale:${rowDay}`);
    log.debug({ event: 'cover', source: 'reuters_today', url: row.image_url }, '');
    return {
      url: row.image_url,
      description: row.description ?? null,
      link: row.link ?? null,
    };
  }

  // CDN convention (snow channel): HEAD-probe the daily CDN URL, else default.
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
  return fallback('cdn_miss');
}
