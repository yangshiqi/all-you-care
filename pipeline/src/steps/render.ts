// pipeline/src/steps/render.ts
import type { StepContext, StepResult } from '../cli.js';
import { claim, commit, markFailed, type PrePublishRow } from '../lib/db.js';
import { callLlm } from '../lib/llm.js';
import { loadPrompt } from '../lib/prompt.js';
import { sanitizeIssueHtml } from '../lib/sanitize.js';

interface RenderOutput {
  content_html: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Server-injected style shell.
// AI channel: LLM produces structured cards (headline-box + spotlight + persona sections + general).
//   The outer shell adds <h1> title, optional date subtitle, and hero image.
//   The "核心摘要" block is intentionally removed — replaced by the LLM's headline-box.
// SNOW channel: LLM still produces the legacy markdown→HTML cards; shell adds title + cover only
//   (silent fallback when content_md isn't JSON).
function wrapShell(channel: 'ai' | 'snow', innerHtml: string, pp: PrePublishRow): string {
  const css = channel === 'ai' ? AI_CSS : SNOW_CSS;
  const safeTitle = escapeHtml(pp.title);
  let date = '';
  try {
    const parsed = JSON.parse(pp.content_md) as { date?: string };
    date = parsed.date ?? '';
  } catch {
    // not JSON (snow channel still emits markdown) — silent fallback, no date subtitle
  }
  const subtitle = date
    ? `<p class="subtitle">${escapeHtml(date)} · 过去 24 小时</p>`
    : '';
  const heroImg = pp.cover_image
    ? `<img src="${escapeHtml(pp.cover_image)}" alt="Cover" class="hero-img">`
    : '';
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${safeTitle}</title>
<style>${css}</style>
</head>
<body>
<div class="container">
<h1>${safeTitle}</h1>
${subtitle}
${heroImg}
${innerHtml}
</div>
</body>
</html>`;
}

const AI_CSS = `
  :root {
    --bg: #f7f9fc;
    --card: #fff;
    --text: #1a202c;
    --text-light: #4a5568;
    --text-muted: #718096;
    --accent: #2563eb;
    --accent-light: #dbeafe;
    --headline-bg: #fef3c7;
    --headline-border: #f59e0b;
    --spotlight-bg: #fff7ed;
    --spotlight-border: #ea580c;
    --persona-creator: #ec4899;
    --persona-engineer: #06b6d4;
    --persona-investor: #16a34a;
    --score-color: #ea580c;
  }

  body {
    font-family: "PingFang SC", "Microsoft YaHei", -apple-system, system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    margin: 0;
    padding: 0;
    line-height: 1.7;
    font-size: 16px;
  }

  .container {
    max-width: 760px;
    margin: 0 auto;
    background: var(--card);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    padding: 32px 24px;
  }

  h1 {
    text-align: center;
    margin: 0 0 8px;
    font-size: 1.875rem;
    font-weight: 700;
  }

  .subtitle {
    text-align: center;
    color: var(--text-muted);
    font-size: 0.95rem;
    margin-bottom: 24px;
  }

  .hero-img {
    width: 100%;
    border-radius: 12px;
    margin-bottom: 24px;
  }

  /* Headline analysis box */
  .headline-box {
    background: var(--headline-bg);
    border-left: 4px solid var(--headline-border);
    padding: 16px 20px;
    border-radius: 8px;
    margin-bottom: 32px;
  }
  .headline-label {
    font-weight: 600;
    font-size: 0.95rem;
    color: #92400e;
    margin-bottom: 8px;
  }
  .headline-text {
    margin: 0;
    color: #78350f;
    font-size: 1rem;
    line-height: 1.7;
  }

  /* Section titles */
  .section-title {
    font-size: 1.4rem;
    font-weight: 700;
    margin: 32px 0 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--text);
  }

  /* Spotlight cards */
  .spotlight-section { margin-bottom: 40px; }
  .spotlight-card {
    background: var(--spotlight-bg);
    border-left: 4px solid var(--spotlight-border);
    margin-bottom: 16px;
    padding: 16px 20px;
    border-radius: 8px;
  }
  .spotlight-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }
  .spotlight-rank {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--spotlight-border);
  }
  .spotlight-score {
    background: var(--spotlight-border);
    color: white;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 600;
  }
  .spotlight-title {
    font-size: 1.15rem;
    font-weight: 600;
    margin: 0 0 8px;
  }
  .spotlight-desc {
    color: var(--text-light);
    margin: 0 0 12px;
  }
  .spotlight-why {
    background: rgba(255,255,255,0.6);
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.9rem;
    color: #7c2d12;
    margin-top: 8px;
    font-style: italic;
  }

  /* Persona sections */
  .persona-section { margin-bottom: 32px; }
  .persona-creator { color: var(--persona-creator); border-bottom-color: var(--persona-creator); }
  .persona-engineer { color: var(--persona-engineer); border-bottom-color: var(--persona-engineer); }
  .persona-investor { color: var(--persona-investor); border-bottom-color: var(--persona-investor); }

  .persona-card {
    background: #fafbfc;
    border-radius: 6px;
    padding: 12px 16px;
    margin-bottom: 12px;
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 6px;
  }
  .card-header h4 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 600;
    flex: 1;
  }
  .score-pill {
    background: var(--accent-light);
    color: var(--accent);
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
  }
  .persona-card p {
    color: var(--text-light);
    font-size: 0.95rem;
    margin: 0 0 8px;
  }

  /* General feed */
  .general-section { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; }
  .general-list {
    list-style: none;
    padding: 0;
    margin: 0;
    columns: 1;
  }
  .general-list li {
    padding: 6px 0;
    border-bottom: 1px dashed #e2e8f0;
  }
  .general-list li:last-child { border-bottom: none; }
  .general-list a {
    color: var(--text-light);
    text-decoration: none;
    font-size: 0.95rem;
  }
  .general-list a:hover { color: var(--accent); }

  /* Links + utility */
  .link-btn {
    display: inline-block;
    color: var(--accent);
    text-decoration: none;
    font-size: 0.9rem;
    margin-right: 12px;
  }
  .link-btn:hover { text-decoration: underline; }

  @media (max-width: 600px) {
    .container { padding: 20px 16px; border-radius: 0; }
    h1 { font-size: 1.5rem; }
    .section-title { font-size: 1.2rem; }
    .spotlight-title { font-size: 1.05rem; }
  }
`;

const SNOW_CSS = `
  body { font-family: "PingFang SC", "Microsoft YaHei", sans-serif; background-color: #eef5fb; margin: 0; padding: 0; color: #0d47a1; line-height: 1.7; font-size: 1rem; }
  .container { max-width: 98%; margin: 10px auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(13,71,161,0.08); padding: 10px 10px; }
  h1 { text-align: center; margin-bottom: 30px; font-size: 1.875rem; color: #0d47a1; }
  section { margin-bottom: 40px; }
  h2 { border-left: 6px solid #1565c0; padding-left: 12px; margin-bottom: 16px; font-size: 1.5rem; color: #0d47a1; }
  h3 { background: #e3f2fd; padding: 8px 12px; border-radius: 6px; margin-top: 24px; font-size: 1.25rem; color: #0d47a1; }
  article { background: #f3f9ff; border-left: 4px solid #1565c0; margin: 16px 0; padding: 12px 16px; border-radius: 6px; }
  article h4 { margin: 0; font-size: 1.25rem; color: #0d47a1; }
  article p { margin-top: 8px; color: #455a64; }
  .summary { background: #e8f1fb; padding: 16px; border-radius: 8px; color: #0d47a1; font-size: 1rem; }
  .hero-img { width: 100%; margin: 0 auto 30px; border-radius: 12px; }
  .inline-img { max-width: 100%; border-radius: 6px; margin: 8px 0; }
  .meta-box { margin-top: 16px; padding-top: 12px; border-top: 1px dashed #b0c7df; font-size: 0.95rem; }
  .meta-row { display: flex; margin-bottom: 6px; align-items: baseline; }
  .meta-row:last-child { margin-bottom: 0; }
  .meta-label { white-space: nowrap; min-width: 3em; color: #5b7595; font-weight: normal; }
  .score-val { color: #d97706; }
  .reason-text { color: #0d47a1; font-style: italic; }
  .link-btn { color: #1565c0; text-decoration: none; font-size: 0.95rem; margin-right: 10px; }
  .link-btn:hover { text-decoration: underline; }
`;

export async function run(ctx: StepContext): Promise<StepResult> {
  const { channel, channelDir, db, log, dryRun } = ctx;
  const claimed = await claim.forRender(db, channel.name, 5);
  let processed = 0,
    failed = 0;

  for (const pp of claimed) {
    try {
      // AI channel stores structured JSON in content_md (rendered via {{json_payload}}).
      // SNOW channel still stores legacy markdown (rendered via {{markdown}}).
      const promptVars: Record<string, string> = channel.name === 'ai'
        ? { json_payload: pp.content_md }
        : { markdown: pp.content_md };
      const prompt = await loadPrompt(channelDir, 'render', promptVars);
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
      const fullHtml = wrapShell(channel.name, inner, pp);
      const sanitized = sanitizeIssueHtml(fullHtml);
      await commit.render(db, pp.id, sanitized);
      log.info(
        { event: 'render_ok', pre_publish_id: pp.id, html_bytes: sanitized.length },
        '',
      );
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
