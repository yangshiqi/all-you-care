// pipeline/src/steps/weekly.ts
//
// Weekly digest: aggregates 7 days of daily issues into a trend/action report.

import type { StepContext, StepResult } from '../cli.js';
import { resolveLlm } from '../channels/types.js';
import { callLlm } from '../lib/llm.js';
import { loadPrompt } from '../lib/prompt.js';
import { pickCoverImage } from '../lib/coverImage.js';
import { trackUsage } from '../lib/usage.js';

type Persona = 'creator' | 'engineer' | 'investor';
const PERSONA_KEYS: readonly Persona[] = ['creator', 'engineer', 'investor'];

interface DailyPayload {
  title: string;
  date: string;
  top_picks?: { title: string; description: string; links: string[]; score: number }[];
  by_persona?: Record<Persona, { title: string; description: string; links: string[]; score: number }[]>;
  general?: { title: string; link: string }[];
}

interface WeeklyEvent {
  title: string;
  description: string;
  score: number;
  date: string;
}

interface WeeklyLlmOutput {
  headline: string;
  top_events: {
    title: string;
    one_liner: string;
    follow_up: string | null;
    why_matters: string;
  }[];
  actions: Record<Persona, string[]>;
  one_number: {
    value: string;
    context: string;
  };
  tags: string[];
}

// ---- Rendering (weekly-specific HTML) -------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderWeeklyContent(out: WeeklyLlmOutput): string {
  const parts: string[] = [];

  // 1. One number — hero position, first thing readers see
  if (out.one_number) {
    parts.push(`<section class="number-hero">
  <div class="number-value">${escapeHtml(out.one_number.value)}</div>
  <div class="number-context">${escapeHtml(out.one_number.context)}</div>
</section>`);
  }

  // 2. Top events
  if (out.top_events.length > 0) {
    const items = out.top_events.map((e, i) => `
    <article class="event-card">
      <div class="event-content">
        <h3><span class="event-index">${String(i + 1).padStart(2, '0')}</span> ${escapeHtml(e.title)}</h3>
        <p class="event-summary">${escapeHtml(e.one_liner)}</p>
        ${e.follow_up ? `<p class="event-followup"><strong>后续进展</strong> ${escapeHtml(e.follow_up)}</p>` : ''}
        <p class="event-insight">${escapeHtml(e.why_matters)}</p>
      </div>
    </article>`).join('\n');
    parts.push(`<section class="section">
  <h2 class="section-heading">本周大事</h2>
  <div class="events-list">
${items}
  </div>
</section>`);
  }

  // 3. Actions by persona
  const personaMeta: { key: Persona; label: string; icon: string; cls: string }[] = [
    { key: 'engineer', label: '工程师', icon: '&lt;/&gt;', cls: 'act-engineer' },
    { key: 'investor', label: '投资人', icon: '$$',        cls: 'act-investor' },
    { key: 'creator',  label: '创业者', icon: '&#x25B2;',  cls: 'act-creator'  },
  ];
  const actionSections: string[] = [];
  for (const meta of personaMeta) {
    const actions = out.actions[meta.key] ?? [];
    if (actions.length === 0) continue;
    const items = actions.map(a => `      <li>${escapeHtml(a)}</li>`).join('\n');
    actionSections.push(`
    <div class="action-card ${meta.cls}">
      <div class="action-body">
        <h4><span class="action-icon">${meta.icon}</span> ${meta.label}</h4>
        <ul>
${items}
        </ul>
      </div>
    </div>`);
  }
  if (actionSections.length > 0) {
    parts.push(`<section class="section">
  <h2 class="section-heading">本周行动建议</h2>
  <div class="actions-grid">
${actionSections.join('\n')}
  </div>
</section>`);
  }

  return parts.join('\n\n');
}

const WEEKLY_CSS = `
  :root {
    --bg: #fafaf9;
    --surface: #fff;
    --text: #1c1917;
    --text-secondary: #57534e;
    --text-muted: #a8a29e;
    --accent: #0c4a6e;
    --accent-light: #e0f2fe;
    --divider: #e7e5e4;
    --engineer: #0369a1;
    --engineer-bg: #f0f9ff;
    --investor: #15803d;
    --investor-bg: #f0fdf4;
    --creator: #9333ea;
    --creator-bg: #faf5ff;
    --number-bg: linear-gradient(135deg, #0c4a6e 0%, #1e3a5f 100%);
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: "Noto Serif SC", "Source Han Serif CN", "PingFang SC", Georgia, serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.85;
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
  }

  .container {
    max-width: 680px;
    margin: 0 auto;
    padding: 48px 24px 64px;
  }

  h1 {
    font-size: 1.75rem;
    font-weight: 900;
    line-height: 1.3;
    margin-bottom: 8px;
    letter-spacing: -0.02em;
  }

  .subtitle {
    font-family: -apple-system, system-ui, sans-serif;
    color: var(--text-muted);
    font-size: 0.85rem;
    margin-bottom: 40px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--divider);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .hero-img {
    width: 100%;
    border-radius: 4px;
    margin-bottom: 40px;
  }

  /* One number hero */
  .number-hero {
    background: var(--number-bg);
    color: #fff;
    text-align: center;
    padding: 48px 32px;
    border-radius: 8px;
    margin-bottom: 48px;
  }
  .number-value {
    font-family: -apple-system, system-ui, sans-serif;
    font-size: 3.5rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin-bottom: 12px;
  }
  .number-context {
    font-size: 0.95rem;
    opacity: 0.85;
    max-width: 480px;
    margin: 0 auto;
    line-height: 1.6;
  }

  /* Section headings */
  .section { margin-bottom: 48px; }
  .section-heading {
    font-family: -apple-system, system-ui, sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--text-muted);
    margin-bottom: 24px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--text);
  }

  /* Event cards */
  .event-card {
    padding: 24px 0;
    border-bottom: 1px solid var(--divider);
  }
  .event-card:last-child { border-bottom: none; }
  .event-content h3 {
    font-size: 1.15rem;
    font-weight: 700;
    margin-bottom: 8px;
    line-height: 1.4;
  }
  .event-index {
    font-family: -apple-system, system-ui, sans-serif;
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--accent);
    opacity: 0.35;
    margin-right: 10px;
  }
  .event-summary {
    color: var(--text-secondary);
    font-size: 0.95rem;
    margin-bottom: 6px;
    line-height: 1.7;
  }
  .event-followup {
    font-size: 0.88rem;
    color: var(--text-muted);
    padding-left: 1rem;
    line-height: 1.6;
    margin-bottom: 8px;
  }
  .event-insight {
    font-style: italic;
    color: var(--text-secondary);
    font-size: 0.9rem;
    padding-left: 16px;
    border-left: 2px solid var(--accent);
    margin-top: 4px;
  }

  /* Action cards */
  .actions-grid {
    display: grid;
    gap: 16px;
  }
  .action-card {
    display: flex;
    gap: 16px;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid var(--divider);
  }
  .action-body h4 {
    font-family: -apple-system, system-ui, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 8px;
  }
  .action-icon {
    font-family: "SF Mono", "Fira Code", monospace;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 700;
    margin-right: 8px;
    vertical-align: middle;
  }
  .action-body ul {
    list-style: none;
    padding: 0;
  }
  .action-body li {
    font-size: 0.9rem;
    padding: 4px 0;
    padding-left: 16px;
    position: relative;
    color: var(--text-secondary);
  }
  .action-body li::before {
    content: "\\2192";
    position: absolute;
    left: 0;
    font-weight: 600;
  }

  .act-engineer { background: var(--engineer-bg); border-color: var(--engineer); }
  .act-engineer .action-icon { background: var(--engineer); color: #fff; }
  .act-engineer h4 { color: var(--engineer); }
  .act-engineer li::before { color: var(--engineer); }

  .act-investor { background: var(--investor-bg); border-color: var(--investor); }
  .act-investor .action-icon { background: var(--investor); color: #fff; }
  .act-investor h4 { color: var(--investor); }
  .act-investor li::before { color: var(--investor); }

  .act-creator { background: var(--creator-bg); border-color: var(--creator); }
  .act-creator .action-icon { background: var(--creator); color: #fff; }
  .act-creator h4 { color: var(--creator); }
  .act-creator li::before { color: var(--creator); }
`;

// ---- Step entrypoint ------------------------------------------------------

export async function run(ctx: StepContext): Promise<StepResult> {
  const { channel, channelDir, db, log, dryRun, now } = ctx;

  // Determine the week range (Monday–Saturday, CST).
  // Runs on Sunday: covers Mon(yesterday-5) to Sat(yesterday).
  // Runs on other days: covers last 7 days.
  const cstNow = new Date(now.getTime() + 8 * 3600_000);
  const dayOfWeek = cstNow.getUTCDay(); // 0=Sun
  const weekEnd = new Date(cstNow);
  weekEnd.setUTCDate(weekEnd.getUTCDate() - (dayOfWeek === 0 ? 1 : 0));
  const weekStart = new Date(weekEnd);
  weekStart.setUTCDate(weekStart.getUTCDate() - (dayOfWeek === 0 ? 5 : 6));

  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);
  const isoWeekStart = `${weekStartStr}T00:00:00+08:00`;
  const isoWeekEnd = `${weekEndStr}T23:59:59+08:00`;

  // Week number for journal_id slug (ISO week).
  const jan4 = new Date(weekStart.getUTCFullYear(), 0, 4);
  const weekNum = Math.ceil(((weekStart.getTime() - jan4.getTime()) / 86400_000 + jan4.getUTCDay() + 1) / 7);
  const weekSlug = `W${weekStart.getUTCFullYear()}-${String(weekNum).padStart(2, '0')}`;

  log.info({ event: 'weekly_range', weekStart: weekStartStr, weekEnd: weekEndStr, slug: weekSlug }, '');

  // Idempotency: skip if this week's digest already exists.
  const { data: existing } = await db.from('pre_publish')
    .select('id, title')
    .eq('channel', channel.name)
    .eq('issue_type', 'weekly')
    .gte('created_at', isoWeekStart)
    .limit(1);
  const existingRow = existing?.[0] as { id: number; title: string } | undefined;
  if (existingRow) {
    log.info({ event: 'weekly_skip_exists', id: existingRow.id, title: existingRow.title }, 'weekly already exists');
    return { processed: 0, skipped: 0, failed: 0, notes: `weekly already exists as pre_publish ${existingRow.id}` };
  }

  // Load all daily pre_publish payloads from the past week.
  const { data: dailyPp, error: ppErr } = await db.from('pre_publish')
    .select('content_md, created_at')
    .eq('channel', channel.name)
    .eq('published', true)
    .eq('issue_type', 'daily')
    .gte('created_at', isoWeekStart)
    .lte('created_at', isoWeekEnd)
    .order('created_at', { ascending: true });

  if (ppErr) {
    log.error({ event: 'weekly_fetch_fail', err: ppErr.message }, '');
    return { processed: 0, skipped: 0, failed: 1, notes: ppErr.message };
  }
  if (!dailyPp || dailyPp.length === 0) {
    log.info({ event: 'weekly_no_data' }, 'no daily issues found for the week');
    return { processed: 0, skipped: 0, failed: 0, notes: 'no daily issues' };
  }

  // Extract all events with their dates.
  const events: WeeklyEvent[] = [];
  for (const row of dailyPp as { content_md: string; created_at: string }[]) {
    try {
      const p = JSON.parse(row.content_md) as DailyPayload;
      const date = p.date ?? row.created_at.slice(0, 10);
      for (const tp of p.top_picks ?? []) {
        events.push({ title: tp.title, description: tp.description, score: tp.score, date });
      }
      for (const pk of PERSONA_KEYS) {
        for (const card of p.by_persona?.[pk] ?? []) {
          events.push({ title: card.title, description: card.description, score: card.score, date });
        }
      }
      for (const g of p.general ?? []) {
        events.push({ title: g.title, description: '', score: 0, date });
      }
    } catch { /* skip non-JSON */ }
  }

  log.info({ event: 'weekly_events', count: events.length, issues: dailyPp.length }, '');

  if (dryRun) {
    log.info({ event: 'dry_run', events: events.length, issues: dailyPp.length }, '');
    return { processed: 0, skipped: 0, failed: 0, notes: `dry-run: ${events.length} events from ${dailyPp.length} issues` };
  }

  // LLM call.
  const payload = { events: events.map(e => ({ title: e.title, description: e.description.slice(0, 150), score: e.score, date: e.date })) };
  const prompt = await loadPrompt(channelDir, 'weekly', {
    week_start: weekStartStr,
    week_end: weekEndStr,
    issue_count: String(dailyPp.length),
    json_payload: JSON.stringify(payload),
  });

  const llmCfg = resolveLlm(channel, 'weekly');
  const llm = await callLlm<WeeklyLlmOutput>({
    prompt,
    expectJson: true,
    model: llmCfg.model,
    maxTokens: llmCfg.maxTokens,
    temperature: llmCfg.temperature,
    chain: llmCfg.chain,
    log,
  });
  await trackUsage(db, { channel: channel.name, step: 'weekly', provider: llm.provider, model: llm.model, input_tokens: llm.inputTokens, output_tokens: llm.outputTokens }, log);

  const out = llm.json;
  if (!out) throw new Error('weekly LLM returned no JSON');

  // Build title.
  let headline = typeof out.headline === 'string' ? out.headline.trim() : '';
  if (!headline) headline = '本周 AI 行业要闻';
  const issueTitle = `[AI]周报 - ${weekStartStr.slice(5)}~${weekEndStr.slice(5)}：${headline}`;

  // Render HTML.
  const innerHtml = renderWeeklyContent(out);
  const cover = await pickCoverImage(db, channel, channel.name, log);

  const weeklyPayload = {
    ...out,
    title: issueTitle,
    week_start: weekStartStr,
    week_end: weekEndStr,
    cover: { description: cover.description, link: cover.link },
  };

  const contentHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(issueTitle)}</title>
<style>${WEEKLY_CSS}</style>
</head>
<body>
<div class="container">
<h1>${escapeHtml(issueTitle)}</h1>
<p class="subtitle">${escapeHtml(weekStartStr)} ~ ${escapeHtml(weekEndStr)} · ${dailyPp.length} 期日报精华</p>
${cover.url ? `<img src="${escapeHtml(cover.url)}" alt="Cover" class="hero-img">` : ''}
${innerHtml}
</div>
</body>
</html>`;

  // Insert directly (not via merge_commit RPC since weekly has no scored_draft sources).
  const { data: inserted, error: insErr } = await db.from('pre_publish')
    .insert({
      channel: channel.name,
      title: issueTitle,
      summary: out.headline,
      content_md: JSON.stringify(weeklyPayload),
      content_html: contentHtml,
      tags: out.tags ?? [],
      cover_image: cover.url,
      source_scored_ids: [],
      issue_type: 'weekly',
    })
    .select('id')
    .single();

  if (insErr || !inserted) {
    log.error({ event: 'weekly_insert_fail', err: insErr?.message }, '');
    return { processed: 0, skipped: 0, failed: 1, notes: insErr?.message ?? 'insert failed' };
  }

  log.info({
    event: 'weekly_ok',
    pre_publish_id: inserted.id,
    title: issueTitle,
    week: weekSlug,
    events: events.length,
    top_events: out.top_events.length,
  }, '');

  return { processed: 1, skipped: 0, failed: 0, notes: `pre_publish ${inserted.id}: ${issueTitle}` };
}
