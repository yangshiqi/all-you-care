import RssParser from 'rss-parser';
import type { Logger } from './log.js';

export interface RssItem {
  title: string;
  content: string;
  link: string | null;
  pub_date: string | null;
  guid: string | null;
  source: string;          // hostname
}

const parser = new RssParser({ timeout: 30_000 });

export async function fetchFeed(url: string, log: Logger): Promise<RssItem[]> {
  const feed = await parser.parseURL(url);
  const host = (() => {
    try { return new URL(url).hostname; } catch { return url; }
  })();
  const out: RssItem[] = [];
  for (const item of feed.items ?? []) {
    out.push({
      title: (item.title ?? '').trim(),
      content: (item.contentSnippet ?? item.content ?? '').toString(),
      link: item.link ?? null,
      pub_date: item.isoDate ?? item.pubDate ?? null,
      guid: item.guid ?? item.id ?? null,
      source: host,
    });
  }
  log.debug({ event: 'rss', url, count: out.length }, 'rss ok');
  return out;
}
