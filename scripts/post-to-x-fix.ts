import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { mkdir } from 'node:fs/promises';
import process from 'node:process';
import path from 'node:path';
import {
  CHROME_CANDIDATES_FULL,
  CdpConnection,
  findChromeExecutable,
  getDefaultProfileDir,
  getFreePort,
  sleep,
  waitForChromeDebugPort,
} from '/Users/ysq/.openclaw/skills/baoyu-post-to-x/scripts/x-utils.ts';

const X_COMPOSE_URL = 'https://x.com/compose/post';

async function postToXFix() {
  const text = fs.readFileSync('/Users/ysq/Work/all-you-care/content/drafts/x-post.txt', 'utf8').trim();
  const imagePath = '/Users/ysq/Work/all-you-care/content/drafts/journal-147-cover-v2.png';
  const profileDir = '/Users/ysq/.local/share/x-browser-profile';
  const submit = true;

  const chromePath = findChromeExecutable(CHROME_CANDIDATES_FULL);
  if (!chromePath) throw new Error('Chrome not found.');

  await mkdir(profileDir, { recursive: true });
  const port = await getFreePort();
  console.log(`[x-browser-fix] Launching Chrome...`);

  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-blink-features=AutomationControlled',
    X_COMPOSE_URL,
  ], { stdio: 'ignore' });

  let cdp: CdpConnection | null = null;
  try {
    const wsUrl = await waitForChromeDebugPort(port, 30_000, { includeLastError: true });
    cdp = await CdpConnection.connect(wsUrl, 30_000, { defaultTimeoutMs: 15_000 });

    const targets = await cdp.send<{ targetInfos: Array<{ targetId: string; url: string; type: string }> }>('Target.getTargets');
    let pageTarget = targets.targetInfos.find((t) => t.type === 'page' && t.url.includes('x.com'));
    const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', { targetId: pageTarget!.targetId, flatten: true });

    await cdp.send('Page.enable', {}, { sessionId });
    await cdp.send('Runtime.enable', {}, { sessionId });

    console.log('[x-browser-fix] Typing text...');
    await sleep(5000); // Wait for load

    await cdp.send('Runtime.evaluate', {
      expression: `
        const editor = document.querySelector('[data-testid="tweetTextarea_0"]');
        if (editor) {
          editor.focus();
          document.execCommand('insertText', false, ${JSON.stringify(text)});
        }
      `,
    }, { sessionId });
    await sleep(1000);

    console.log('[x-browser-fix] Uploading image via file input...');
    // Find the file input
    const { result } = await cdp.send<{ result: { value: boolean } }>('Runtime.evaluate', {
      expression: `!!document.querySelector('input[type="file"][data-testid="fileInput"]')`,
      returnByValue: true,
    }, { sessionId });

    if (result.value) {
       // CDP DOM.setFileInputFiles requires a backendNodeId or nodeId
       const { root } = await cdp.send<{ root: { nodeId: number } }>('DOM.getDocument', {}, { sessionId });
       const { nodeId } = await cdp.send<{ nodeId: number }>('DOM.querySelector', {
         nodeId: root.nodeId,
         selector: 'input[type="file"][data-testid="fileInput"]'
       }, { sessionId });

       await cdp.send('DOM.setFileInputFiles', {
         files: [imagePath],
         nodeId
       }, { sessionId });
       console.log('[x-browser-fix] Image uploaded.');
       await sleep(5000);
    } else {
       console.error('[x-browser-fix] File input not found.');
    }

    if (submit) {
      console.log('[x-browser-fix] Submitting...');
      await cdp.send('Runtime.evaluate', {
        expression: `document.querySelector('[data-testid="tweetButton"]')?.click()`,
      }, { sessionId });
      await sleep(3000);
      console.log('[x-browser-fix] Done.');
    }
  } finally {
    if (cdp) {
      try { await cdp.send('Browser.close', {}, { timeoutMs: 5_000 }); } catch {}
      cdp.close();
    }
    chrome.kill();
  }
}

postToXFix().catch(console.error);
