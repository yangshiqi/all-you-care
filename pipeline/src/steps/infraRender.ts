// pipeline/src/steps/infraRender.ts
import type {
  InfraWeeklyPayload, InfraReportItem, InfraReportCategory, InfraSource,
} from '../lib/infraTypes.js';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function parseInfraPayload(contentMd: string): InfraWeeklyPayload | null {
  try {
    const p = JSON.parse(contentMd) as unknown;
    return p && typeof p === 'object' ? (p as InfraWeeklyPayload) : null;
  } catch { return null; }
}

function renderSources(sources: InfraSource[]): string {
  if (!sources.length) return '';
  const links = sources
    .map((s) => `<a class="src-link" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`)
    .join(' · ');
  return `<div class="item-sources">来源：${links}</div>`;
}

const FIELD_ROWS: ReadonlyArray<{ key: keyof InfraReportItem; label: string }> = [
  { key: 'what', label: '是什么' },
  { key: 'problem', label: '解决什么问题' },
  { key: 'value', label: '落地价值' },
  { key: 'scenarios', label: '适用场景' },
  { key: 'pitfalls', label: '踩坑提醒' },
];

function renderItem(it: InfraReportItem): string {
  const rows = FIELD_ROWS
    .map(({ key, label }) => {
      const v = String(it[key] ?? '').trim();
      if (!v) return '';
      const cls = key === 'pitfalls' ? 'field field-pitfalls' : 'field';
      return `    <p class="${cls}"><span class="field-label">${label}：</span>${esc(v)}</p>`;
    })
    .filter(Boolean)
    .join('\n');
  const kind = it.kind ? `<span class="item-kind">${esc(it.kind)}</span>` : '';
  return `  <article class="infra-item">
    <div class="item-head">
      <h4 class="item-title">${esc(it.title)}</h4>
      <span class="item-score">⭐ ${it.score.toFixed(1)}</span>${kind}
    </div>
${rows}
    ${renderSources(it.sources)}
  </article>`;
}

function renderCategory(cat: InfraReportCategory): string {
  const body = cat.empty_note
    ? `  <p class="empty-note">${esc(cat.empty_note)}</p>`
    : cat.items.map(renderItem).join('\n');
  return `<section class="infra-section">
  <h3 class="section-title">${esc(cat.label)}</h3>
${body}
</section>`;
}

export function renderInfraContent(payload: InfraWeeklyPayload): string {
  const parts: string[] = [];

  if (payload.overview?.trim())
    parts.push(`<section class="overview-box"><h3 class="section-title">开篇总览</h3><p>${esc(payload.overview)}</p></section>`);

  for (const cat of payload.categories) parts.push(renderCategory(cat));

  if (payload.trends?.length) {
    const li = payload.trends.map((t) => `    <li>${esc(t)}</li>`).join('\n');
    parts.push(`<section class="infra-section"><h3 class="section-title">行业趋势总结</h3>\n  <ul class="trend-list">\n${li}\n  </ul>\n</section>`);
  }
  if (payload.recommendations?.length) {
    const li = payload.recommendations
      .map((r) => `    <li><span class="rec-audience">${esc(r.audience)}：</span>${esc(r.text)}</li>`)
      .join('\n');
    parts.push(`<section class="infra-section"><h3 class="section-title">落地优先级建议</h3>\n  <ul class="rec-list">\n${li}\n  </ul>\n</section>`);
  }
  return parts.join('\n\n');
}

export const INFRA_CSS = `
  :root { --bg:#f6f8fa; --card:#fff; --text:#1f2328; --muted:#57606a; --accent:#0969da;
          --line:#d0d7de; --pitfall:#9a6700; --pitfall-bg:#fff8c5; }
  body { font-family:"PingFang SC","Microsoft YaHei",-apple-system,system-ui,sans-serif;
         background:var(--bg); color:var(--text); margin:0; padding:0; line-height:1.7; font-size:16px; }
  .container { max-width:820px; margin:0 auto; background:var(--card); border-radius:14px;
               box-shadow:0 4px 20px rgba(0,0,0,.05); padding:32px 28px; }
  h1 { text-align:center; margin:0 0 6px; font-size:1.8rem; font-weight:700; }
  .subtitle { text-align:center; color:var(--muted); font-size:.95rem; margin-bottom:24px; }
  .hero-img { width:100%; border-radius:10px; margin-bottom:16px; }
  .section-title { font-size:1.3rem; font-weight:700; margin:28px 0 14px; padding-bottom:6px;
                   border-bottom:2px solid var(--text); }
  .overview-box { background:#ddf4ff; border-left:4px solid var(--accent); border-radius:8px;
                  padding:4px 18px 14px; margin-bottom:28px; }
  .overview-box .section-title { border-bottom-color:var(--accent); }
  .infra-section { margin-bottom:32px; }
  .infra-item { border:1px solid var(--line); border-radius:10px; padding:14px 18px; margin-bottom:16px;
                background:#fbfcfd; }
  .item-head { display:flex; align-items:center; gap:10px; margin-bottom:8px; flex-wrap:wrap; }
  .item-title { margin:0; font-size:1.1rem; font-weight:600; flex:1; }
  .item-score { background:var(--accent); color:#fff; padding:2px 10px; border-radius:999px;
                font-size:.8rem; font-weight:600; white-space:nowrap; }
  .item-kind { background:#eaeef2; color:var(--muted); padding:2px 8px; border-radius:999px; font-size:.78rem; }
  .field { margin:6px 0; color:var(--text); }
  .field-label { font-weight:600; color:var(--muted); }
  .field-pitfalls { background:var(--pitfall-bg); border-radius:6px; padding:8px 10px; color:var(--pitfall); }
  .item-sources { margin-top:10px; padding-top:8px; border-top:1px dashed var(--line); font-size:.9rem; color:var(--muted); }
  .src-link { color:var(--accent); text-decoration:none; }
  .src-link:hover { text-decoration:underline; }
  .empty-note { color:var(--muted); font-style:italic; padding:4px 0; }
  .trend-list, .rec-list { padding-left:20px; margin:0; }
  .trend-list li, .rec-list li { margin:6px 0; }
  .rec-audience { font-weight:600; color:var(--accent); }
  @media (max-width:600px){ .container{padding:20px 16px;border-radius:0;} h1{font-size:1.5rem;} .section-title{font-size:1.15rem;} }
`;
