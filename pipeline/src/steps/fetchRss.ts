// pipeline/src/steps/fetchRss.ts
import type { StepContext, StepResult } from '../cli.js';
import { fetchFeed } from '../lib/rss.js';
import { fetchOpmlFeeds } from '../lib/opml.js';
import { canonicalizeLink } from '../lib/linkCanonical.js';
import { ageHours } from '../lib/time.js';

const FEED_CONCURRENCY = 8;

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
  // Skipped is bucketed by reason so we can see at a glance what the pipeline
  // is actually dropping. Historically a single `skipped` counter conflated
  // dedup hits with age-filter drops with silent no-pub-date drops, making it
  // impossible to tell whether a feed was contributing.
  let processed = 0, dup = 0, tooOld = 0, acceptedNoPubDate = 0, failed = 0;

  async function handleFeed(url: string): Promise<void> {
    try {
      const items = await fetchFeed(url, log);
      for (const it of items) {
        // pub_date is OPTIONAL in the RSS/Atom spec; minimal personal blogs
        // often omit it. The old check (`ageHours(null) = Infinity`) silently
        // dropped every item from such feeds forever. Now: treat missing
        // pub_date as "fresh enough to consider once" and let DB dedup handle
        // re-fetches. First encounter with a long no-pubDate feed will insert
        // all its items in one go; subsequent ticks no-op via 23505.
        let isFallbackPubDate = false;
        let effectivePubDate: string | null = it.pub_date;
        if (it.pub_date == null) {
          isFallbackPubDate = true;
          effectivePubDate = now.toISOString();
        } else if (ageHours(it.pub_date, now) > channel.windows.fetch_rss_age_hours) {
          tooOld++;
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
          pub_date: effectivePubDate,
          external_id: it.guid,
        }, { count: 'exact' }).select('id').single();
        if (insert.error) {
          // 23505 = unique violation (dedup) → skip 不算失败
          if ((insert.error as { code?: string }).code === '23505') {
            dup++;
          } else {
            failed++;
            log.warn({ event: 'insert_fail', err: insert.error.message, title: it.title.slice(0, 80) }, 'rss insert failed');
          }
        } else {
          processed++;
          if (isFallbackPubDate) acceptedNoPubDate++;
        }
      }
    } catch (e) {
      log.warn({ event: 'feed_fail', url, err: (e as Error).message }, 'feed fetch failed');
      failed++;
    }
  }

  let cursor = 0;
  const workers = Array.from({ length: Math.min(FEED_CONCURRENCY, feeds.length) }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= feeds.length) return;
      await handleFeed(feeds[idx]!);
    }
  });
  await Promise.all(workers);

  const skipped = dup + tooOld;
  log.info(
    {
      event: 'fetch_rss_summary',
      feeds: feeds.length,
      processed,
      dup,
      too_old: tooOld,
      accepted_no_pub_date: acceptedNoPubDate,
      failed,
    },
    '',
  );
  return {
    processed,
    skipped,
    failed,
    notes:
      `${feeds.length} feeds (static=${staticFeeds.length}, opml=${opmlFeeds.length}, ` +
      `concurrency=${FEED_CONCURRENCY}); dup=${dup}, too_old=${tooOld}, ` +
      `accepted_no_pub_date=${acceptedNoPubDate}`,
  };
}
