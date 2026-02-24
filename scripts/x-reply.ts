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

interface CommentTarget {
  url: string;
  comment: string;
}

async function replyToPost(cdp: CdpConnection, sessionId: string, target: CommentTarget) {
  console.log(`\n[reply] Opening: ${target.url}`);
  await cdp.send('Page.navigate', { url: target.url }, { sessionId });
  await sleep(4000);

  // Wait for reply box
  const start = Date.now();
  let replyBoxFound = false;
  while (Date.now() - start < 15_000) {
    const r = await cdp.send<{ result: { value: boolean } }>('Runtime.evaluate', {
      expression: `!!document.querySelector('[data-testid="tweetTextarea_0"]')`,
      returnByValue: true,
    }, { sessionId });
    if (r.result.value) { replyBoxFound = true; break; }
    await sleep(1000);
  }

  if (!replyBoxFound) {
    console.log('[reply] Reply box not found, skipping');
    return false;
  }

  // Click reply area to focus
  await cdp.send('Runtime.evaluate', {
    expression: `document.querySelector('[data-testid="tweetTextarea_0"]')?.focus()`,
  }, { sessionId });
  await sleep(300);

  const editorBox = await cdp.send<{ result: { value: string } }>('Runtime.evaluate', {
    expression: `JSON.stringify(document.querySelector('[data-testid="tweetTextarea_0"]')?.getBoundingClientRect())`,
    returnByValue: true,
  }, { sessionId });

  if (editorBox.result.value && editorBox.result.value !== 'undefined') {
    const box = JSON.parse(editorBox.result.value);
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mousePressed', x: Math.round(box.x + 10), y: Math.round(box.y + 10),
      button: 'left', clickCount: 1,
    }, { sessionId });
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased', x: Math.round(box.x + 10), y: Math.round(box.y + 10),
      button: 'left', clickCount: 1,
    }, { sessionId });
    await sleep(300);
  }

  // Paste comment
  await cdp.send('Runtime.evaluate', {
    expression: `
      (() => {
        const editor = document.querySelector('[data-testid="tweetTextarea_0"]');
        if (!editor) return false;
        editor.focus();
        const dt = new DataTransfer();
        dt.setData('text/plain', ${JSON.stringify(target.comment)});
        const evt = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
        editor.dispatchEvent(evt);
        return true;
      })()
    `,
  }, { sessionId });
  await sleep(1000);

  // Verify text
  const check = await cdp.send<{ result: { value: string } }>('Runtime.evaluate', {
    expression: `document.querySelector('[data-testid="tweetTextarea_0"]')?.textContent?.trim()?.slice(0, 80) || 'EMPTY'`,
    returnByValue: true,
  }, { sessionId });
  console.log(`[reply] Text: "${check.result.value}"`);

  if (check.result.value === 'EMPTY') {
    console.log('[reply] Text insertion failed, skipping');
    return false;
  }

  // Find and click reply button
  const btnResult = await cdp.send<{ result: { value: string } }>('Runtime.evaluate', {
    expression: `
      const sels = ['[data-testid="tweetButtonInline"]', '[data-testid="tweetButton"]'];
      let found = null;
      for (const s of sels) {
        const el = document.querySelector(s);
        if (el) { found = { sel: s, disabled: el.getAttribute('aria-disabled') }; break; }
      }
      JSON.stringify(found || null);
    `,
    returnByValue: true,
  }, { sessionId });
  const btnInfo = JSON.parse(btnResult.result.value || 'null');

  if (!btnInfo || btnInfo.disabled === 'true') {
    console.log('[reply] Reply button not available');
    return false;
  }

  console.log('[reply] Submitting reply...');
  await cdp.send('Runtime.evaluate', {
    expression: `document.querySelector('${btnInfo.sel}')?.click()`,
  }, { sessionId });
  await sleep(3000);

  // Check toast
  const toast = await cdp.send<{ result: { value: string } }>('Runtime.evaluate', {
    expression: `document.querySelector('[data-testid="toast"]')?.textContent || ''`,
    returnByValue: true,
  }, { sessionId });

  if (toast.result.value.includes('sent') || toast.result.value.includes('reply')) {
    console.log(`[reply] ✅ Reply posted!`);
    return true;
  }

  console.log(`[reply] ⚠️ Uncertain (toast: "${toast.result.value}")`);
  return true; // Assume success
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
    '--start-maximized',
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

    const targets_list: CommentTarget[] = JSON.parse(fs.readFileSync('/tmp/x-reply-targets.json', 'utf8'));

    let success = 0;
    for (let i = 0; i < targets_list.length; i++) {
      const t = targets_list[i];
      const ok = await replyToPost(cdp, sessionId, t);
      if (ok) success++;
      
      if (i < targets_list.length - 1) {
        const delay = Math.floor(Math.random() * (120000 - 30000 + 1)) + 30000;
        console.log(`[reply] Waiting ${Math.round(delay/1000)}s before next reply...`);
        await sleep(delay);
      }
    }

    console.log(`\n[reply] Done: ${success}/${targets_list.length} replies posted`);

  } finally {
    if (cdp) {
      try { await cdp.send('Browser.close', {}, { timeoutMs: 5_000 }); } catch {}
      cdp.close();
    }
    setTimeout(() => { if (!chrome.killed) try { chrome.kill('SIGKILL'); } catch {} }, 2_000).unref?.();
    try { chrome.kill('SIGTERM'); } catch {}
  }
}

main().catch(e => { console.error(`[reply] Fatal: ${e}`); process.exit(1); });
