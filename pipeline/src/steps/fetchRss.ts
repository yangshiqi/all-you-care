// pipeline/src/steps/fetchRss.ts
import type { StepContext, StepResult } from '../cli.js';
import { fetchFeed } from '../lib/rss.js';
import { fetchOpmlFeeds } from '../lib/opml.js';
import { canonicalizeLink } from '../lib/linkCanonical.js';
import { ageHours } from '../lib/time.js';

const FEED_CONCURRENCY = 4; // lowered from 8: high concurrency triggered random TLS resets against github.com

/** Share of the feed list that must be down before we call it a step failure. */
export const FEED_FAIL_ALERT_RATIO = 0.5;

/**
 * How many feed-level failures should count against the step.
 *
 * A stable minority of feeds is always dead — the OPML blob is a third-party
 * list nobody prunes, and datacenter IPs get 403'd by Substack no matter what
 * we send. Counting those as step failures made `fetch` exit 1 on every hour
 * that happened to bring in zero new items (cli.ts exits 1 when
 * `failed > 0 && processed === 0`), so the workflow went red at random and the
 * signal was worthless. Only a broad outage — half the list or more — is a
 * failure worth waking up to.
 */
export function feedOutageFailures(feedCount: number, feedsFailed: number): number {
  if (feedCount === 0) return 0;
  return feedsFailed / feedCount >= FEED_FAIL_ALERT_RATIO ? feedsFailed : 0;
}

export async function run(ctx: StepContext): Promise<StepResult> {
  const { channel, db, log, now } = ctx;
  const staticFeeds = channel.sources.rss.filter(r => r.enabled).map(r => r.url);
  const opmlSources = (channel.sources.opml ?? []).filter(r => r.enabled);
  const denied = new Set(channel.sources.rss_deny ?? []);

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

  // `rss_deny` prunes the OPML blob, which we don't control: entries that fail
  // on every single tick (dead domains, permanent 403s) are dropped up front so
  // they neither cost a request nor pollute the failure count. It applies to the
  // merged list, so denying a URL beats `enabled: true` on a static entry.
  const allFeeds = [...new Set<string>([...staticFeeds, ...opmlFeeds])];
  const feeds = allFeeds.filter(u => !denied.has(u));
  const deniedCount = allFeeds.length - feeds.length;
  // Skipped is bucketed by reason so we can see at a glance what the pipeline
  // is actually dropping. Historically a single `skipped` counter conflated
  // dedup hits with age-filter drops with silent no-pub-date drops, making it
  // impossible to tell whether a feed was contributing.
  // `feedsFailed` (a whole feed unreachable) is tracked apart from `insertFailed`
  // (we got items but couldn't store them) — only the latter is unambiguously
  // our problem. See feedOutageFailures above.
  let processed = 0, dup = 0, tooOld = 0, acceptedNoPubDate = 0;
  let insertFailed = 0, feedsFailed = 0;

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
            insertFailed++;
            log.warn({ event: 'insert_fail', err: insert.error.message, title: it.title.slice(0, 80) }, 'rss insert failed');
          }
        } else {
          processed++;
          if (isFallbackPubDate) acceptedNoPubDate++;
        }
      }
    } catch (e) {
      log.warn({ event: 'feed_fail', url, err: (e as Error).message }, 'feed fetch failed');
      feedsFailed++;
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
  const outage = feedOutageFailures(feeds.length, feedsFailed);
  const failed = insertFailed + outage;
  if (outage > 0) {
    log.error(
      { event: 'feed_outage', feeds: feeds.length, feeds_failed: feedsFailed },
      'most feeds unreachable — treating as a step failure',
    );
  }
  log.info(
    {
      event: 'fetch_rss_summary',
      feeds: feeds.length,
      processed,
      dup,
      too_old: tooOld,
      accepted_no_pub_date: acceptedNoPubDate,
      feeds_failed: feedsFailed,
      denied: deniedCount,
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
      `denied=${deniedCount}, concurrency=${FEED_CONCURRENCY}); dup=${dup}, too_old=${tooOld}, ` +
      `accepted_no_pub_date=${acceptedNoPubDate}, feeds_failed=${feedsFailed}`,
  };
}
