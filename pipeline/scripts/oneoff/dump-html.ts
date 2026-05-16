// Dump the rendered HTML for a pre_publish row to /tmp for visual inspection.
import { createDb } from '../../src/lib/db.js';
import { writeFileSync } from 'node:fs';

const db = createDb();

async function main() {
  const targetId = Number(process.argv[2] ?? 6);
  const { data, error } = await db
    .from('pre_publish')
    .select('id, title, content_html')
    .eq('id', targetId)
    .single();
  if (error) throw new Error(error.message);
  if (!data || !data.content_html) {
    console.error(`pre_publish id=${targetId} has no content_html`);
    process.exit(1);
  }
  const out = `/tmp/pre_publish_${targetId}.html`;
  writeFileSync(out, data.content_html);
  console.log(`wrote ${data.content_html.length} bytes to ${out}`);
  console.log(`title: ${data.title}`);
  // Print structural summary: tag counts.
  const counts: Record<string, number> = {};
  for (const m of data.content_html.matchAll(/<(\w+)/g)) {
    counts[m[1]!] = (counts[m[1]!] ?? 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20);
  console.log('\nTop tag counts:');
  for (const [tag, n] of top) console.log(`  <${tag}>: ${n}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
