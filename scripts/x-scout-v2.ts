import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { mkdir } from 'node:fs/promises';
import {
  CHROME_CANDIDATES_FULL,
  CdpConnection,
  findChromeExecutable,
  getFreePort,
  sleep,
  waitForChromeDebugPort,
} from '/Users/ysq/.openclaw/skills/baoyu-post-to-x/scripts/x-utils.ts';

const profileDir = '/Users/ysq/.local/share/x-browser-profile';

async function searchX(cdp: CdpConnection, sessionId: string, query: string) {
  // Navigate to search
  await cdp.send('Page.navigate', { url: `https://x.com/search?q=${encodeURIComponent(query)}&f=top` }, { sessionId });
  await sleep(5000);

  const posts = await cdp.send<{ result: { value: string } }>('Runtime.evaluate', {
    expression: `
      (() => {
        const articles = document.querySelectorAll('article[data-testid="tweet"]');
        const results = [];
        for (let i = 0; i < Math.min(articles.length, 10); i++) {
          const a = articles[i];
          const textEl = a.querySelector('[data-testid="tweetText"]');
          const text = textEl?.textContent?.trim() || '';
          const links = a.querySelectorAll('a[href*="/status/"]');
          let href = '';
          for (const l of links) {
            const h = l.getAttribute('href');
            if (h && h.match(/\\/status\\/\\d+$/)) { href = h; break; }
          }
          const timeEl = a.querySelector('time');
          const time = timeEl?.getAttribute('datetime') || '';
          const nameEl = a.querySelector('[data-testid="User-Name"]');
          const name = nameEl?.textContent?.trim()?.split('·')[0]?.trim() || '';
          if (text.length > 30 && href) {
            results.push({ text: text.slice(0, 250), href, time, name });
          }
        }
        return JSON.stringify(results);
      })()
    `,
    returnByValue: true,
  }, { sessionId });
  return JSON.parse(posts.result.value || '[]');
}

async function main() {
  const chromePath = findChromeExecutable(CHROME_CANDIDATES_FULL);
  if (!chromePath) throw new Error('Chrome not found');
  await mkdir(profileDir, { recursive: true });
  const port = await getFreePort();

  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run', '--no-default-browser-check',
    '--disable-blink-features=AutomationControlled',
    'https://x.com/home',
  ], { stdio: 'ignore' });

  let cdp: CdpConnection | null = null;
  try {
    const wsUrl = await waitForChromeDebugPort(port, 30_000, { includeLastError: true });
    cdp = await CdpConnection.connect(wsUrl, 30_000, { defaultTimeoutMs: 15_000 });
    const targets = await cdp.send<{ targetInfos: Array<{ targetId: string; url: string; type: string }> }>('Target.getTargets');
    const pageTarget = targets.targetInfos.find((t) => t.type === 'page' && t.url.includes('x.com'));
    if (!pageTarget) throw new Error('No X page');
    const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', { targetId: pageTarget.targetId, flatten: true });
    await cdp.send('Page.enable', {}, { sessionId });
    await cdp.send('Runtime.enable', {}, { sessionId });
    await sleep(3000);

    const queries = [
      'OpenClaw AI agent',
      'AI 商业化 成本',
      'Nvidia GB300 AI',
      'AI agent 自动化 workflow',
    ];

    const allPosts: any[] = [];
    for (const q of queries) {
      console.log(`[scout] Searching: "${q}"`);
      const results = await searchX(cdp, sessionId, q);
      console.log(`[scout] Found ${results.length} posts`);
      allPosts.push(...results.map((p: any) => ({ ...p, query: q })));
    }

    // Deduplicate by href
    const seen = new Set();
    const unique = allPosts.filter(p => {
      if (seen.has(p.href)) return false;
      seen.add(p.href);
      return true;
    });

    console.log(`\n[scout] Total unique posts: ${unique.length}`);
    unique.forEach((p, i) => {
      console.log(`\n--- ${i+1} [${p.query}] ---`);
      console.log(`${p.name}`);
      console.log(`${p.text}`);
      console.log(`https://x.com${p.href}`);
    });

    fs.writeFileSync('/tmp/x-scout-results.json', JSON.stringify(unique, null, 2));
  } finally {
    if (cdp) {
      try { await cdp.send('Browser.close', {}, { timeoutMs: 5_000 }); } catch {}
      cdp.close();
    }
    setTimeout(() => { if (!chrome.killed) try { chrome.kill('SIGKILL'); } catch {} }, 2_000).unref?.();
    try { chrome.kill('SIGTERM'); } catch {}
  }
}

main().catch(e => { console.error(`[scout] Fatal: ${e}`); process.exit(1); });
