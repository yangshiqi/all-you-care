// Read-only preview of the new AI merge dedup against latest scored_drafts.
// Does NOT mutate DB, does NOT call LLM.
import { createDb } from '../../src/lib/db.js';
import { parseScoredEvents, deduplicateEvents } from '../../src/lib/eventDedup.js';

const db = createDb();

async function main() {
  // Pull the most recent ai scored_drafts. Limit 50 to mirror claim.forMerge cap.
  const { data, error } = await db
    .from('scored_drafts')
    .select('id, content, created_at, merged')
    .eq('channel', 'ai')
    .order('id', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  console.log(`fetched ${rows.length} ai scored_drafts (newest first)`);
  for (const r of rows) {
    console.log(`  id=${r.id} merged=${r.merged} created=${r.created_at} content_len=${r.content?.length ?? 0}`);
  }
  if (rows.length === 0) return;

  const contents = rows.map((r) => r.content as string);
  const raw = contents.flatMap((c) => parseScoredEvents(c));
  console.log(`\nparsed ${raw.length} raw events from ${rows.length} scored_drafts`);

  const merged = deduplicateEvents(raw);
  console.log(`deduped to ${merged.length} unique events (${raw.length - merged.length} merged away)\n`);

  const dups = merged.filter((e) => e.source_count > 1);
  if (dups.length > 0) {
    console.log(`--- ${dups.length} event(s) had duplicates ---`);
    for (const e of dups) {
      console.log(`  id=${e.id} score=${e.score} src_count=${e.source_count}  ${e.title}`);
    }
    console.log();
  } else {
    console.log('(no duplicates detected)\n');
  }

  console.log('--- top 10 by score ---');
  const top = [...merged].sort((a, b) => b.score - a.score).slice(0, 10);
  for (const e of top) {
    console.log(`  id=${e.id} ${e.score.toFixed(1)}  ${e.title}  [${e.links.length} link(s)]`);
  }

  // Build the slim LLM payload that runAiMerge would send.
  const llmEvents = merged.map((e) => ({
    id: e.id,
    title: e.title,
    score: e.score,
    description: e.description.length > 100 ? `${e.description.slice(0, 100)}…` : e.description,
  }));
  const sample = JSON.stringify({ events: llmEvents.slice(0, 5), old_titles: ['<truncated>'] }, null, 2);
  console.log(`\n--- LLM payload size: ${JSON.stringify(llmEvents).length} chars over ${llmEvents.length} events ---`);
  console.log('first 5 events:');
  console.log(sample);

  // Sanity: score distribution.
  const buckets = { high: 0, mid: 0, low: 0 };
  for (const e of merged) {
    if (e.score >= 6.5) buckets.high++;
    else if (e.score >= 4) buckets.mid++;
    else buckets.low++;
  }
  console.log(`\nscore distribution: high(>=6.5)=${buckets.high}  mid(4-6.5)=${buckets.mid}  low(<4)=${buckets.low}`);
  console.log(`  → general bucket will be ${buckets.mid + buckets.low}, persona pool will be ${buckets.high}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
