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

async function main() {
  const chromePath = findChromeExecutable(CHROME_CANDIDATES_FULL);
  if (!chromePath) throw new Error('Chrome not found');
  await mkdir(profileDir, { recursive: true });
  const port = await getFreePort();

  // Search X for AI-related trending posts
  const searchUrl = 'https://x.com/search?q=AI%20agent%20automation&f=top';
  
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-blink-features=AutomationControlled',
    '--start-maximized',
    searchUrl,
  ], { stdio: 'ignore' });

  let cdp: CdpConnection | null = null;
  try {
    const wsUrl = await waitForChromeDebugPort(port, 30_000, { includeLastError: true });
    cdp = await CdpConnection.connect(wsUrl, 30_000, { defaultTimeoutMs: 15_000 });

    const targets = await cdp.send<{ targetInfos: Array<{ targetId: string; url: string; type: string }> }>('Target.getTargets');
    const pageTarget = targets.targetInfos.find((t) => t.type === 'page' && t.url.includes('x.com'));
    if (!pageTarget) throw new Error('No X page found');

    const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', { targetId: pageTarget.targetId, flatten: true });
    await cdp.send('Page.enable', {}, { sessionId });
    await cdp.send('Runtime.enable', {}, { sessionId });

    console.log('[scout] Waiting for search results...');
    await sleep(5000);

    // Extract top posts with engagement
    const posts = await cdp.send<{ result: { value: string } }>('Runtime.evaluate', {
      expression: `
        (() => {
          const articles = document.querySelectorAll('article[data-testid="tweet"]');
          const results = [];
          for (let i = 0; i < Math.min(articles.length, 15); i++) {
            const a = articles[i];
            const textEl = a.querySelector('[data-testid="tweetText"]');
            const text = textEl?.textContent?.trim() || '';
            const linkEl = a.querySelector('a[href*="/status/"]');
            const href = linkEl?.getAttribute('href') || '';
            const timeEl = a.querySelector('time');
            const time = timeEl?.getAttribute('datetime') || '';
            const nameEl = a.querySelector('[data-testid="User-Name"]');
            const name = nameEl?.textContent?.trim()?.split('·')[0]?.trim() || '';
            // Get engagement metrics
            const metrics = a.querySelectorAll('[data-testid$="count"]');
            const engagement = [...metrics].map(m => m.textContent?.trim()).join(',');
            if (text.length > 20) {
              results.push({ text: text.slice(0, 200), href, time, name, engagement });
            }
          }
          return JSON.stringify(results);
        })()
      `,
      returnByValue: true,
    }, { sessionId });

    console.log('[scout] Found posts:');
    const postList = JSON.parse(posts.result.value || '[]');
    postList.forEach((p: any, i: number) => {
      console.log(`\\n--- Post ${i+1} ---`);
      console.log(`Author: ${p.name}`);
      console.log(`Text: ${p.text}`);
      console.log(`URL: https://x.com${p.href}`);
      console.log(`Time: ${p.time}`);
    });

    // Save for processing
    fs.writeFileSync('/tmp/x-scout-results.json', JSON.stringify(postList, null, 2));
    console.log(`\\n[scout] Saved ${postList.length} posts to /tmp/x-scout-results.json`);

    // Take screenshot
    const { data } = await cdp.send<{ data: string }>('Page.captureScreenshot', { format: 'png' }, { sessionId });
    fs.writeFileSync('/tmp/x-scout.png', Buffer.from(data, 'base64'));

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
