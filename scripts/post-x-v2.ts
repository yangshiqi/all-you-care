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

const X_HOME_URL = 'https://x.com/home';
const TIMEOUT = 60_000;

async function main() {
  const args = process.argv.slice(2);
  const shouldSubmit = args.includes('--submit');
  
  // Parse args
  const images: string[] = [];
  let profileDir = '/Users/ysq/.local/share/x-browser-profile';
  let textFile = '';
  const textParts: string[] = [];
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === '--image' && args[i + 1]) { images.push(args[++i]!); }
    else if (arg === '--profile' && args[i + 1]) { profileDir = args[++i]!; }
    else if (arg === '--text-file' && args[i + 1]) { textFile = args[++i]!; }
    else if (arg === '--submit') { /* already handled */ }
    else if (!arg.startsWith('-')) { textParts.push(arg); }
  }
  
  const text = textFile ? fs.readFileSync(textFile, 'utf8').trim() : textParts.join(' ').trim();
  if (!text && images.length === 0) { console.error('Need text or image'); process.exit(1); }

  const chromePath = findChromeExecutable(CHROME_CANDIDATES_FULL);
  if (!chromePath) throw new Error('Chrome not found');

  await mkdir(profileDir, { recursive: true });
  const port = await getFreePort();

  console.log(`[post-x] Launching Chrome...`);
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-blink-features=AutomationControlled',
    '--start-maximized',
    X_HOME_URL,
  ], { stdio: 'ignore' });

  let cdp: CdpConnection | null = null;

  try {
    const wsUrl = await waitForChromeDebugPort(port, 30_000, { includeLastError: true });
    cdp = await CdpConnection.connect(wsUrl, 30_000, { defaultTimeoutMs: 15_000 });

    const targets = await cdp.send<{ targetInfos: Array<{ targetId: string; url: string; type: string }> }>('Target.getTargets');
    let pageTarget = targets.targetInfos.find((t) => t.type === 'page' && t.url.includes('x.com'));
    if (!pageTarget) {
      const { targetId } = await cdp.send<{ targetId: string }>('Target.createTarget', { url: X_HOME_URL });
      pageTarget = { targetId, url: X_HOME_URL, type: 'page' };
    }

    const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', { targetId: pageTarget.targetId, flatten: true });
    await cdp.send('Page.enable', {}, { sessionId });
    await cdp.send('Runtime.enable', {}, { sessionId });
    await cdp.send('DOM.enable', {}, { sessionId });
    await cdp.send('Input.setIgnoreInputEvents', { ignore: false }, { sessionId });

    // Wait for editor
    console.log('[post-x] Waiting for editor...');
    const start = Date.now();
    let editorFound = false;
    while (Date.now() - start < TIMEOUT) {
      const r = await cdp.send<{ result: { value: boolean } }>('Runtime.evaluate', {
        expression: `!!document.querySelector('[data-testid="tweetTextarea_0"]')`,
        returnByValue: true,
      }, { sessionId });
      if (r.result.value) { editorFound = true; break; }
      await sleep(1000);
    }
    if (!editorFound) throw new Error('Editor not found - login may be required');

    // --- TEXT: paste via ClipboardEvent (preserves order, handles emoji) ---
    if (text) {
      console.log('[post-x] Inserting text via paste event...');
      await cdp.send('Runtime.evaluate', {
        expression: `document.querySelector('[data-testid="tweetTextarea_0"]')?.focus()`,
      }, { sessionId });
      await sleep(500);

      // Click editor to ensure focus
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

      // Use DataTransfer + paste event (X's Draft.js editor handles paste)
      const pasteResult = await cdp.send<{ result: { value: boolean } }>('Runtime.evaluate', {
        expression: `
          (() => {
            const editor = document.querySelector('[data-testid="tweetTextarea_0"]');
            if (!editor) return false;
            editor.focus();
            const dt = new DataTransfer();
            dt.setData('text/plain', ${JSON.stringify(text)});
            const evt = new ClipboardEvent('paste', {
              clipboardData: dt,
              bubbles: true,
              cancelable: true,
            });
            editor.dispatchEvent(evt);
            return true;
          })()
        `,
        returnByValue: true,
      }, { sessionId });
      console.log(`[post-x] Paste event dispatched: ${pasteResult.result.value}`);
      await sleep(1500);

      // Verify
      const check = await cdp.send<{ result: { value: string } }>('Runtime.evaluate', {
        expression: `
          const editors = document.querySelectorAll('[data-testid^="tweetTextarea"]');
          [...editors].map(e => e.textContent?.trim()).filter(Boolean).join(' | ').slice(0, 150) || 'EMPTY'
        `,
        returnByValue: true,
      }, { sessionId });
      console.log(`[post-x] Text check: "${check.result.value}"`);

      // If paste didn't work, fallback to execCommand line by line
      if (check.result.value === 'EMPTY' || check.result.value.length < 10) {
        console.log('[post-x] Paste failed, falling back to execCommand...');
        await cdp.send('Runtime.evaluate', {
          expression: `
            const editor = document.querySelector('[data-testid="tweetTextarea_0"]');
            if (editor) { editor.focus(); document.execCommand('insertText', false, ${JSON.stringify(text)}); }
          `,
        }, { sessionId });
        await sleep(1000);
      }
    }

    // --- IMAGE: use DOM.setFileInputFiles (bypass broken Swift clipboard) ---
    for (const imagePath of images) {
      if (!fs.existsSync(imagePath)) { console.warn(`[post-x] Image not found: ${imagePath}`); continue; }
      
      console.log(`[post-x] Uploading image: ${imagePath}`);
      const { root } = await cdp.send<{ root: { nodeId: number } }>('DOM.getDocument', {}, { sessionId });
      
      // Try specific selector first, then generic
      let nodeId = 0;
      for (const sel of ['input[type="file"][data-testid="fileInput"]', 'input[type="file"]']) {
        const r = await cdp.send<{ nodeId: number }>('DOM.querySelector', { nodeId: root.nodeId, selector: sel }, { sessionId });
        if (r.nodeId > 0) { nodeId = r.nodeId; break; }
      }
      
      if (nodeId === 0) {
        console.warn('[post-x] File input not found, skipping image');
        continue;
      }

      await cdp.send('DOM.setFileInputFiles', { files: [imagePath], nodeId }, { sessionId });
      console.log('[post-x] Image uploaded');
      await sleep(5000); // Wait for X to process
    }

    // --- CHECK STATE ---
    const imgCount = await cdp.send<{ result: { value: number } }>('Runtime.evaluate', {
      expression: `document.querySelectorAll('[data-testid="attachments"] img, [data-testid="imagePreview"] img, [role="group"] img').length`,
      returnByValue: true,
    }, { sessionId });
    console.log(`[post-x] Images in compose: ${imgCount.result.value}`);

    // Find submit button
    const btnResult = await cdp.send<{ result: { value: string } }>('Runtime.evaluate', {
      expression: `
        const sels = ['[data-testid="tweetButtonInline"]', '[data-testid="tweetButton"]'];
        let found = null;
        for (const s of sels) {
          const el = document.querySelector(s);
          if (el) { found = { sel: s, disabled: el.getAttribute('aria-disabled'), text: el.textContent?.trim() }; break; }
        }
        JSON.stringify(found || null);
      `,
      returnByValue: true,
    }, { sessionId });
    const btnInfo = JSON.parse(btnResult.result.value || 'null');
    console.log(`[post-x] Button: ${JSON.stringify(btnInfo)}`);

    if (shouldSubmit) {
      if (!btnInfo) { console.error('[post-x] Submit button not found!'); process.exit(1); }
      if (btnInfo.disabled === 'true') { console.error('[post-x] Button disabled'); process.exit(1); }

      console.log(`[post-x] Clicking "${btnInfo.text}"...`);
      await cdp.send('Runtime.evaluate', {
        expression: `document.querySelector('${btnInfo.sel}')?.click()`,
      }, { sessionId });
      await sleep(4000);

      // Verify
      const gone = await cdp.send<{ result: { value: boolean } }>('Runtime.evaluate', {
        expression: `!document.querySelector('[data-testid="tweetTextarea_0"]') || document.querySelector('[data-testid="tweetTextarea_0"]')?.textContent?.trim() === ''`,
        returnByValue: true,
      }, { sessionId });
      
      // Also check for toast
      const toast = await cdp.send<{ result: { value: string } }>('Runtime.evaluate', {
        expression: `document.querySelector('[data-testid="toast"]')?.textContent || ''`,
        returnByValue: true,
      }, { sessionId });

      if (toast.result.value.includes('sent') || toast.result.value.includes('发送')) {
        console.log(`[post-x] ✅ Success! Toast: "${toast.result.value}"`);
      } else if (gone.result.value) {
        console.log('[post-x] ✅ Likely success (compose cleared)');
      } else {
        console.log('[post-x] ⚠️ Uncertain result');
        const { data } = await cdp.send<{ data: string }>('Page.captureScreenshot', { format: 'png' }, { sessionId });
        fs.writeFileSync('/tmp/x-post-debug.png', Buffer.from(data, 'base64'));
        console.log('[post-x] Debug screenshot: /tmp/x-post-debug.png');
      }
    } else {
      console.log('[post-x] Preview mode. Use --submit to post.');
      // Take screenshot for verification
      const { data } = await cdp.send<{ data: string }>('Page.captureScreenshot', { format: 'png' }, { sessionId });
      fs.writeFileSync('/tmp/x-post-preview.png', Buffer.from(data, 'base64'));
      console.log('[post-x] Preview screenshot: /tmp/x-post-preview.png');
      await sleep(15_000);
    }

  } finally {
    if (cdp) {
      try { await cdp.send('Browser.close', {}, { timeoutMs: 5_000 }); } catch {}
      cdp.close();
    }
    setTimeout(() => { if (!chrome.killed) try { chrome.kill('SIGKILL'); } catch {} }, 2_000).unref?.();
    try { chrome.kill('SIGTERM'); } catch {}
  }
}

main().catch(e => { console.error(`[post-x] Fatal: ${e}`); process.exit(1); });
