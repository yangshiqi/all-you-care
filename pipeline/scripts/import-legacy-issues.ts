// pipeline/scripts/import-legacy-issues.ts
// Usage: tsx scripts/import-legacy-issues.ts ~/Downloads/n8n-ai-contents_rows.csv
//
// 从老 n8n 导出的 CSV 取最新 10 行，写入 issues 表（channel='ai', delivered=true）。
// CSV 列顺序: id, created_at, title, content, source, tags, summary, lang,
//             is_published, img_url, journal_id, embedding

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: tsx scripts/import-legacy-issues.ts <csv-path>');
  process.exit(1);
}

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) {
  console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

// 朴素 CSV parser，处理引号内换行 + 双引号转义。CSV 不大，全文一次性读入。
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ',') { cur.push(field); field = ''; }
      else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else { field += c; }
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows;
}

function parseTags(raw: string): string[] {
  if (!raw) return [];
  // n8n 老格式可能是 JSON array 字符串、逗号分隔、或 PG array literal
  const trimmed = raw.trim();
  if (trimmed.startsWith('[')) {
    try { return JSON.parse(trimmed); } catch { /* fall through */ }
  }
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed.slice(1, -1).split(',').map(s => s.replace(/^"|"$/g, '').trim()).filter(Boolean);
  }
  return trimmed.split(',').map(s => s.trim()).filter(Boolean);
}

async function main() {
  const text = readFileSync(resolve(csvPath!), 'utf8');
  const rows = parseCsv(text);
  const header = rows[0];
  if (!header) throw new Error('CSV is empty');
  const dataRows = rows.slice(1).filter(r => r.length === header.length);

  const idx = (name: string) => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`CSV missing column: ${name}`);
    return i;
  };

  const iCreatedAt = idx('created_at');
  const iTitle = idx('title');
  const iContent = idx('content');
  const iTags = idx('tags');
  const iSummary = idx('summary');
  const iLang = idx('lang');
  const iImgUrl = idx('img_url');
  const iJournalId = idx('journal_id');

  // 按 created_at desc 取前 10
  dataRows.sort((a, b) => (b[iCreatedAt] ?? '').localeCompare(a[iCreatedAt] ?? ''));
  const latest = dataRows.slice(0, 10);

  console.log(`importing ${latest.length} rows`);

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const payload = latest.map(r => {
    const lang = r[iLang]?.includes('en') ? 'en' : 'zh_CN';
    return {
      channel: 'ai' as const,
      lang,
      title: r[iTitle] ?? '(untitled)',
      summary: r[iSummary] || null,
      content_html: r[iContent] ?? '',
      tags: parseTags(r[iTags] ?? ''),
      cover_image: r[iImgUrl] || null,
      journal_id: r[iJournalId] ? Number(r[iJournalId]) : null,
      pre_publish_id: null,
      delivered: true,                  // 历史已发, 不再发邮件
      delivered_at: r[iCreatedAt] || null,
      published_at: r[iCreatedAt] || null,
      created_at: r[iCreatedAt] || new Date().toISOString(),
    };
  });

  const { data, error } = await sb.from('issues').insert(payload).select('id, title');
  if (error) {
    console.error('insert failed:', error);
    process.exit(1);
  }
  console.log(`inserted ${data?.length} issues:`);
  data?.forEach(d => console.log(`  ${d.id}: ${d.title.slice(0, 60)}`));

  // journal_id 若 NULL, 用 id 回填（让自我引用一致）
  for (const row of data ?? []) {
    await sb.from('issues').update({ journal_id: row.id }).eq('id', row.id).is('journal_id', null);
  }
  console.log('done');
}

main().catch(e => { console.error(e); process.exit(1); });
