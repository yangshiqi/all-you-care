import type { Logger } from './log.js';

const XML_URL_RE = /xmlUrl\s*=\s*(["'])([^"']+)\1/g;

export async function fetchOpmlFeeds(url: string, log: Logger): Promise<string[]> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`opml fetch ${res.status} ${res.statusText}`);
  const text = await res.text();
  return parseOpmlFeeds(text, url, log);
}

export function parseOpmlFeeds(text: string, sourceUrl: string, log?: Logger): string[] {
  const urls = new Set<string>();
  for (const m of text.matchAll(XML_URL_RE)) {
    const raw = m[2];
    if (!raw) continue;
    const u = decodeXmlEntities(raw.trim());
    if (u) urls.add(u);
  }
  log?.debug({ event: 'opml', url: sourceUrl, count: urls.size }, 'opml parsed');
  return [...urls];
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
}
