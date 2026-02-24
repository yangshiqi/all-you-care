import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { mkdir } from 'node:fs/promises';
import process from 'node:process';
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

async function main() {
  const args = process.argv.slice(2);
  const textFile = '/Users/ysq/Work/all-you-care/content/drafts/x-post.txt';
  const imagePath = '/Users/ysq/Work/all-you-care/content/drafts/journal-147-cover-v2.png';
  const profileDir = '/Users/ysq/.local/share/x-browser-profile';
  const shouldSubmit = args.includes('--submit');

  const text = fs.readFileSync(textFile, 'utf8').trim();
  if (!text) throw new Error('No text to post');
  if (!fs.existsSync(imagePath)) throw new Error(`Image not found: ${imagePath}`);

  const chromePath = findChromeExecutable(CHROME_CANDIDATES_FULL);
  if (!chromePath) throw new Error('Chrome not found');

  await mkdir(profileDir, { recursive: true });
  const port = await getFreePort();

  console.log(`[post-x] Launching Chrome on port ${port}...`);
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
    if (!pageTarget) {
      const { targetId } = await cdp.send<{ targetId: string }>('Target.createTarget', { url: X_COMPOSE_URL });
      pageTarget = { targetId, url: X_COMPOSE_URL, type: 'page' };
    }

    const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', { targetId: pageTarget.targetId, flatten: true });

    await cdp.send('Page.enable', {}, { sessionId });
    await cdp.send('Runtime.enable', {}, { sessionId });
    await cdp.send('DOM.enable', {}, { sessionId });

    // Wait for editor
    console.log('[post-x] Waiting for editor...');
    const start = Date.now();
    while (Date.now() - start < 60_000) {
      const r = await cdp.send<{ result: { value: boolean } }>('Runtime.evaluate', {
        expression: `!!document.querySelector('[data-testid="tweetTextarea_0"]')`,
        returnByValue: true,
      }, { sessionId });
      if (r.result.value) break;
      await sleep(1000);
    }

    // Type text using keyboard simulation
    console.log('[post-x] Typing text...');
    // Focus the editor first
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('[data-testid="tweetTextarea_0"]')?.focus()`,
    }, { sessionId });
    await sleep(500);

    // Click into the editor to ensure it's active
    const editorBox = await cdp.send<{ result: { value: string } }>('Runtime.evaluate', {
      expression: `JSON.stringify(document.querySelector('[data-testid="tweetTextarea_0"]')?.getBoundingClientRect())`,
      returnByValue: true,
    }, { sessionId });
    
    if (editorBox.result.value && editorBox.result.value !== 'undefined') {
      const box = JSON.parse(editorBox.result.value);
      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: Math.round(box.x + box.width / 2),
        y: Math.round(box.y + box.height / 2),
        button: 'left',
        clickCount: 1,
      }, { sessionId });
      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: Math.round(box.x + box.width / 2),
        y: Math.round(box.y + box.height / 2),
        button: 'left',
        clickCount: 1,
      }, { sessionId });
      await sleep(300);
    }

    // Type text character by character using keyDown/keyUp events
    // For non-ASCII (Chinese, emoji), use Input.dispatchKeyEvent with text
    for (const char of text) {
      await cdp.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: char,
        text: char,
      }, { sessionId });
      await cdp.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: char,
      }, { sessionId });
      // Small delay to not overwhelm
      if (text.indexOf(char) % 20 === 0) await sleep(50);
    }
    await sleep(1500);

    // Verify text was inserted
    const textCheck = await cdp.send<{ result: { value: string } }>('Runtime.evaluate', {
      expression: `document.querySelector('[data-testid="tweetTextarea_0"]')?.textContent?.trim()?.slice(0, 50) || 'EMPTY'`,
      returnByValue: true,
    }, { sessionId });
    console.log(`[post-x] Text verification: "${textCheck.result.value}"`);

    // Upload image via file input (no clipboard needed!)
    console.log('[post-x] Uploading image via file input...');
    const { root } = await cdp.send<{ root: { nodeId: number } }>('DOM.getDocument', {}, { sessionId });
    const { nodeId } = await cdp.send<{ nodeId: number }>('DOM.querySelector', {
      nodeId: root.nodeId,
      selector: 'input[type="file"][data-testid="fileInput"]',
    }, { sessionId });

    if (nodeId === 0) {
      console.error('[post-x] File input not found! Maybe X changed their UI.');
      // Try alternative: click the media button first
      console.log('[post-x] Trying to click media button first...');
      await cdp.send('Runtime.evaluate', {
        expression: `document.querySelector('[data-testid="tweetTextarea_0"]')?.focus()`,
      }, { sessionId });
      await sleep(500);

      // Re-check for file input
      const { root: r2 } = await cdp.send<{ root: { nodeId: number } }>('DOM.getDocument', {}, { sessionId });
      const { nodeId: nid2 } = await cdp.send<{ nodeId: number }>('DOM.querySelector', {
        nodeId: r2.nodeId,
        selector: 'input[type="file"]',
      }, { sessionId });

      if (nid2 === 0) {
        console.error('[post-x] No file input found at all. Posting text only.');
      } else {
        await cdp.send('DOM.setFileInputFiles', {
          files: [imagePath],
          nodeId: nid2,
        }, { sessionId });
        console.log('[post-x] Image uploaded via fallback selector.');
        await sleep(5000);
      }
    } else {
      await cdp.send('DOM.setFileInputFiles', {
        files: [imagePath],
        nodeId,
      }, { sessionId });
      console.log('[post-x] Image uploaded successfully.');
      await sleep(5000);
    }

    // Verify image is attached
    const imgCheck = await cdp.send<{ result: { value: number } }>('Runtime.evaluate', {
      expression: `document.querySelectorAll('[data-testid="attachments"] img, [data-testid="imagePreview"] img, [role="group"] img').length`,
      returnByValue: true,
    }, { sessionId });
    console.log(`[post-x] Images detected in compose area: ${imgCheck.result.value}`);

    // Check tweet button state - try multiple selectors
    const btnCheck = await cdp.send<{ result: { value: string } }>('Runtime.evaluate', {
      expression: `
        const selectors = [
          '[data-testid="tweetButton"]',
          '[data-testid="tweetButtonInline"]',
          'button[data-testid*="tweet"]',
          'button[data-testid*="Tweet"]',
          'div[role="button"][data-testid*="tweet"]',
          'div[role="button"][data-testid*="Tweet"]',
        ];
        let found = null;
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) {
            found = { sel, disabled: el.getAttribute('aria-disabled'), text: el.textContent?.trim() };
            break;
          }
        }
        // Also search for Post/发推 button text
        if (!found) {
          const buttons = document.querySelectorAll('button, div[role="button"]');
          for (const b of buttons) {
            const t = b.textContent?.trim();
            if (t && (t === 'Post' || t === 'Tweet' || t === '发推' || t === 'ポスト')) {
              found = { sel: 'text-match', disabled: b.getAttribute('aria-disabled'), text: t };
              break;
            }
          }
        }
        JSON.stringify(found || 'not-found');
      `,
      returnByValue: true,
    }, { sessionId });
    console.log(`[post-x] Tweet button: ${btnCheck.result.value}`);

    if (shouldSubmit) {
      let btnInfo: { sel?: string; disabled?: string; text?: string } | null = null;
      try { btnInfo = JSON.parse(btnCheck.result.value); } catch {}

      if (!btnInfo) {
        console.error('[post-x] Tweet button not found! Taking debug screenshot...');
        const { data } = await cdp.send<{ data: string }>('Page.captureScreenshot', { format: 'png' }, { sessionId });
        const ssPath = '/Users/ysq/Work/all-you-care/content/drafts/x-post-debug.png';
        fs.writeFileSync(ssPath, Buffer.from(data, 'base64'));
        console.log(`[post-x] Screenshot saved: ${ssPath}`);

        // Last resort: dump all buttons
        const allBtns = await cdp.send<{ result: { value: string } }>('Runtime.evaluate', {
          expression: `JSON.stringify([...document.querySelectorAll('button, div[role="button"]')].slice(0,20).map(b => ({testid: b.getAttribute('data-testid'), text: b.textContent?.trim()?.slice(0,30), tag: b.tagName})))`,
          returnByValue: true,
        }, { sessionId });
        console.log(`[post-x] Available buttons: ${allBtns.result.value}`);
      } else if (btnInfo.disabled === 'true') {
        console.error('[post-x] Tweet button is disabled.');
      } else {
        console.log(`[post-x] Clicking "${btnInfo.text}" button (${btnInfo.sel})...`);
        const clickExpr = btnInfo.sel === 'text-match'
          ? `(() => { const bs = document.querySelectorAll('button, div[role="button"]'); for (const b of bs) { const t = b.textContent?.trim(); if (t === 'Post' || t === 'Tweet' || t === '发推' || t === 'ポスト') { b.click(); return true; } } return false; })()`
          : `(() => { const b = document.querySelector('${btnInfo.sel}'); b?.click(); return !!b; })()`;
        await cdp.send('Runtime.evaluate', { expression: clickExpr }, { sessionId });
        await sleep(3000);

        const dialogCheck = await cdp.send<{ result: { value: boolean } }>('Runtime.evaluate', {
          expression: `!document.querySelector('[data-testid="tweetTextarea_0"]')`,
          returnByValue: true,
        }, { sessionId });
        if (dialogCheck.result.value) {
          console.log('[post-x] ✅ Post successful!');
        } else {
          console.log('[post-x] ⚠️ Compose still open, may have failed.');
          const { data } = await cdp.send<{ data: string }>('Page.captureScreenshot', { format: 'png' }, { sessionId });
          const ssPath = '/Users/ysq/Work/all-you-care/content/drafts/x-post-debug.png';
          fs.writeFileSync(ssPath, Buffer.from(data, 'base64'));
          console.log(`[post-x] Debug screenshot: ${ssPath}`);
        }
      }
    } else {
      console.log('[post-x] Preview mode. Add --submit to actually post.');
      console.log('[post-x] Keeping browser open 30s for preview...');
      await sleep(30_000);
    }

  } finally {
    if (cdp) {
      try { await cdp.send('Browser.close', {}, { timeoutMs: 5_000 }); } catch {}
      cdp.close();
    }
    setTimeout(() => {
      if (!chrome.killed) try { chrome.kill('SIGKILL'); } catch {}
    }, 2_000).unref?.();
    try { chrome.kill('SIGTERM'); } catch {}
  }
}

main().catch((err) => {
  console.error(`[post-x] Fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
