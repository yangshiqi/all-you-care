// pipeline/src/steps/render.ts
import type { StepContext, StepResult } from '../cli.js';
import { claim, commit, markFailed } from '../lib/db.js';
import { callLlm } from '../lib/llm.js';
import { loadPrompt } from '../lib/prompt.js';
import { sanitizeIssueHtml } from '../lib/sanitize.js';

interface RenderOutput { content_html: string }

// Server-injected style shell — LLM produces only inner <div class='container'>...</div>
function wrapShell(channel: 'ai' | 'snow', innerHtml: string, title: string): string {
  const css = channel === 'ai' ? AI_CSS : SNOW_CSS;
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${title.replace(/</g, '&lt;')}</title>
<style>${css}</style></head><body>${innerHtml}</body></html>`;
}

const AI_CSS = `
body{margin:0;font-family:-apple-system,system-ui,sans-serif;background:#0d1117;color:#e6edf3}
.container{max-width:760px;margin:0 auto;padding:24px}
h3.cat-head{margin-top:32px;border-left:4px solid #58a6ff;padding-left:8px}
h4{margin-top:18px}
.link-btn{display:inline-block;padding:4px 10px;border:1px solid #58a6ff;border-radius:4px;color:#58a6ff;text-decoration:none}
.meta{color:#8b949e;font-size:12px;margin-top:6px}
img.inline-img{max-width:100%;border-radius:6px}
`;

const SNOW_CSS = `
body{margin:0;font-family:-apple-system,system-ui,sans-serif;background:#fff;color:#0d47a1}
.container{max-width:760px;margin:0 auto;padding:24px}
h3.cat-head{background:#e3f2fd;padding:6px 10px;border-left:4px solid #1565c0}
h4{margin-top:18px;color:#0d47a1}
.link-btn{display:inline-block;padding:4px 10px;background:#1565c0;color:#fff;border-radius:4px;text-decoration:none}
.meta{color:#546e7a;font-size:12px;margin-top:6px}
img.inline-img{max-width:100%;border-radius:6px}
`;

export async function run(ctx: StepContext): Promise<StepResult> {
  const { channel, channelDir, db, log, dryRun } = ctx;
  const claimed = await claim.forRender(db, channel.name, 5);
  let processed = 0, failed = 0;

  for (const pp of claimed) {
    try {
      const prompt = await loadPrompt(channelDir, 'render', { markdown: pp.content_md });
      if (dryRun) {
        log.info({ event: 'dry_run', would_render: pp.id }, '');
        await markFailed.prePublish(db, pp.id, 'dry_run_release');
        continue;
      }
      const llm = await callLlm<RenderOutput>({
        prompt,
        expectJson: true,
        model: channel.llm.model,
        maxTokens: channel.llm.max_tokens,
        temperature: channel.llm.temperature,
        log,
      });
      const inner = llm.json!.content_html;
      const fullHtml = wrapShell(channel.name, inner, pp.title);
      const sanitized = sanitizeIssueHtml(fullHtml);
      await commit.render(db, pp.id, sanitized);
      log.info({ event: 'render_ok', pre_publish_id: pp.id, html_bytes: sanitized.length }, '');
      processed++;
    } catch (e) {
      const msg = (e as Error).message;
      failed++;
      log.warn({ event: 'render_fail', pre_publish_id: pp.id, err: msg }, '');
      await markFailed.prePublish(db, pp.id, msg);
    }
  }
  return { processed, skipped: 0, failed, notes: `claimed ${claimed.length}` };
}
