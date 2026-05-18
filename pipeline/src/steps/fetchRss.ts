// pipeline/src/steps/fetchRss.ts
import type { StepContext, StepResult } from '../cli.js';
import { fetchFeed } from '../lib/rss.js';
import { fetchOpmlFeeds } from '../lib/opml.js';
import { canonicalizeLink } from '../lib/linkCanonical.js';
import { ageHours } from '../lib/time.js';

export async function run(ctx: StepContext): Promise<StepResult> {
  const { channel, db, log, now } = ctx;
  const staticFeeds = channel.sources.rss.filter(r => r.enabled).map(r => r.url);
  const opmlSources = (channel.sources.opml ?? []).filter(r => r.enabled);

  const opmlFeeds: string[] = [];
  for (const src of opmlSources) {
    try {
      const urls = await fetchOpmlFeeds(src.url, log);
      opmlFeeds.push(...urls);
      log.info({ event: 'opml_ok', url: src.url, count: urls.length }, 'opml feeds loaded');
    } catch (e) {
      log.warn({ event: 'opml_fail', url: src.url, err: (e as Error).message }, 'opml fetch failed');
    }
  }

  const feeds = [...new Set<string>([...staticFeeds, ...opmlFeeds])];
  let processed = 0, skipped = 0, failed = 0;

  for (const url of feeds) {
    try {
      const items = await fetchFeed(url, log);
      for (const it of items) {
        if (ageHours(it.pub_date, now) > channel.windows.fetch_rss_age_hours) {
          skipped++;
          continue;
        }
        const linkCanonical = it.link ? canonicalizeLink(it.link) : null;
        const insert = await db.from('news_items').insert({
          channel: channel.name,
          source_type: 'rss',
          source: it.source,
          title: it.title,
          content: it.content,
          link: it.link,
          link_canonical: linkCanonical,
          pub_date: it.pub_date,
          external_id: it.guid,
        }, { count: 'exact' }).select('id').single();
        if (insert.error) {
          // 23505 = unique violation (dedup) → skip 不算失败
          if ((insert.error as { code?: string }).code === '23505') {
            skipped++;
          } else {
            failed++;
            log.warn({ event: 'insert_fail', err: insert.error.message, title: it.title.slice(0, 80) }, 'rss insert failed');
          }
        } else {
          processed++;
        }
      }
    } catch (e) {
      log.warn({ event: 'feed_fail', url, err: (e as Error).message }, 'feed fetch failed');
      failed++;
    }
  }
  return {
    processed,
    skipped,
    failed,
    notes: `${feeds.length} feeds (static=${staticFeeds.length}, opml=${opmlFeeds.length})`,
  };
}
