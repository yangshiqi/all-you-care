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

// rss-parser 的 item 形状（只取我们用到的字段，含 summary 兜底）。
interface RawRssItem {
  title?: string;
  contentSnippet?: string;
  content?: string;
  summary?: string;
  link?: string;
  isoDate?: string;
  pubDate?: string;
  guid?: string;
  id?: string;
}

/** Pure item→RssItem mapping. Body falls back contentSnippet → content → summary. */
export function mapRssItem(item: RawRssItem, host: string): RssItem {
  return {
    title: (item.title ?? '').trim(),
    content: (item.contentSnippet ?? item.content ?? item.summary ?? '').toString(),
    link: item.link ?? null,
    pub_date: item.isoDate ?? item.pubDate ?? null,
    guid: item.guid ?? item.id ?? null,
    source: host,
  };
}

const parser = new RssParser({ timeout: 30_000 });

export async function fetchFeed(url: string, log: Logger): Promise<RssItem[]> {
  const feed = await parser.parseURL(url);
  const host = (() => {
    try { return new URL(url).hostname; } catch { return url; }
  })();
  const out = (feed.items ?? []).map((item) => mapRssItem(item as RawRssItem, host));
  log.debug({ event: 'rss', url, count: out.length }, 'rss ok');
  return out;
}
