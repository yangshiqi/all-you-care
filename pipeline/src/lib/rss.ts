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

const FEED_TIMEOUT_MS = 30_000;
// rss-parser's own defaults, kept verbatim now that we do the request ourselves.
// Do not "improve" these: a descriptive UA was measurably worse — utcc.utoronto.ca
// rate-limits by User-Agent and answers anything but a known reader with 429.
const FEED_UA = 'rss-parser';
const FEED_ACCEPT = 'application/rss+xml';

const parser = new RssParser({ timeout: FEED_TIMEOUT_MS });

/** Only the head of the body is scanned for a feed root; prologs are short. */
const PROLOG_SCAN_LIMIT = 8192;

/**
 * Does this response look like a feed at all?
 *
 * Several publishers (36kr permanently, marktechpost and
 * artificialintelligence-news intermittently) answer a feed request with an
 * anti-bot HTML challenge page and a 200. Handed straight to sax that surfaces
 * as "Invalid character in entity name" pointing at some inline CSS — it reads
 * like a malformed feed and sends you chasing a parser bug. Checking the
 * content type first turns it into a one-glance diagnosis.
 */
export function isProbablyFeed(body: string): boolean {
  // The body decides, not the content type: krebsonsecurity.com serves a
  // perfectly good RSS document as `text/html`, and rejecting on the header
  // alone would drop a feed that works today. The header still goes into the
  // error message, where it's useful for diagnosis.
  //
  // Skip what a feed may legitimately put before its root element — the XML
  // declaration, stylesheet PIs (WordPress emits one routinely), comments, a
  // DOCTYPE — and then require an actual feed root. Accepting `<?xml` on its
  // own would let XHTML error pages through, which is the case this guard
  // exists to catch.
  const prolog = /^(?:\s+|<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE[^>]*>)*/i;
  const head = body.slice(0, PROLOG_SCAN_LIMIT).replace(prolog, '');
  return /^<(?:rss\b|feed\b|rdf:RDF\b)/i.test(head);
}

/**
 * Fetch the feed body ourselves rather than letting rss-parser do it: that
 * exposes the response headers, which isProbablyFeed needs. Native fetch also
 * decompresses gzip transparently, which rss-parser did not — one OPML feed
 * reached sax as raw gzip bytes and failed with "Non-whitespace before first tag".
 */
async function fetchFeedText(url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': FEED_UA, accept: FEED_ACCEPT },
    signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
  });
  // Same wording rss-parser used, so historical log greps keep working.
  if (!res.ok) throw new Error(`Status code ${res.status}`);
  const contentType = res.headers.get('content-type');
  const text = await res.text();
  if (!isProbablyFeed(text)) {
    throw new Error(`Not a feed (content-type: ${contentType ?? 'none'})`);
  }
  return text;
}

export async function fetchFeed(url: string, log: Logger): Promise<RssItem[]> {
  const feed = await parser.parseString(await fetchFeedText(url));
  const host = (() => {
    try { return new URL(url).hostname; } catch { return url; }
  })();
  const out = (feed.items ?? []).map((item) => mapRssItem(item as RawRssItem, host));
  log.debug({ event: 'rss', url, count: out.length }, 'rss ok');
  return out;
}
