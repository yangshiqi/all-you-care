// Inspect the latest pre_publish row to verify LLM output quality.
import { createDb } from '../../src/lib/db.js';

const db = createDb();

interface AiFinalPayload {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  top_picks: Array<{ title: string; description: string; links: string[]; score: number; why_matters: string }>;
  by_persona: Record<'creator' | 'engineer' | 'investor', Array<{ title: string; score: number }>>;
  general: Array<{ title: string; link: string }>;
}

async function main() {
  const targetId = Number(process.argv[2] ?? 6);
  const { data, error } = await db
    .from('pre_publish')
    .select('id, title, summary, content_md, tags, created_at')
    .eq('id', targetId)
    .single();
  if (error) throw new Error(error.message);
  if (!data) { console.error(`pre_publish id=${targetId} not found`); process.exit(1); }

  console.log(`=== pre_publish id=${data.id} ===`);
  console.log(`title:   ${data.title}`);
  console.log(`summary: ${data.summary}`);
  console.log(`tags:    ${JSON.stringify(data.tags)}`);
  console.log(`created: ${data.created_at}`);
  console.log(`content_md size: ${data.content_md.length}`);

  let payload: AiFinalPayload;
  try {
    payload = JSON.parse(data.content_md) as AiFinalPayload;
  } catch {
    console.log('\n!! content_md is not valid JSON, first 500 chars:');
    console.log(data.content_md.slice(0, 500));
    process.exit(1);
  }

  console.log(`\n--- top_picks (${payload.top_picks.length}) ---`);
  for (const p of payload.top_picks) {
    console.log(`  ${p.score.toFixed(1)} "${p.title}"`);
    console.log(`      why: ${p.why_matters}`);
  }

  console.log(`\n--- by_persona ---`);
  for (const k of ['creator', 'engineer', 'investor'] as const) {
    const arr = payload.by_persona[k] ?? [];
    console.log(`  ${k} (${arr.length}):`);
    for (const item of arr.slice(0, 5)) console.log(`    ${item.score.toFixed(1)} ${item.title}`);
    if (arr.length > 5) console.log(`    ... +${arr.length - 5} more`);
  }

  console.log(`\n--- general (${payload.general.length}, low-score bucket) ---`);
  for (const g of payload.general.slice(0, 10)) console.log(`  - ${g.title}`);
  if (payload.general.length > 10) console.log(`  ... +${payload.general.length - 10} more`);
}

main().catch((e) => { console.error(e); process.exit(1); });
