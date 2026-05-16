import { createDb } from '../../src/lib/db.js';
const db = createDb();
async function main() {
  const { data: pp } = await db.from('pre_publish').select('id, channel, title, created_at, content_md').eq('channel','ai').order('id', { ascending: false }).limit(3);
  console.log('--- pre_publish (latest 3 ai) ---');
  for (const r of (pp ?? [])) {
    console.log({ id: r.id, title: r.title, created: r.created_at, len: r.content_md?.length });
  }
  const { data: iss } = await db.from('issues').select('id, channel, title, published_at').eq('channel','ai').order('id', { ascending: false }).limit(3);
  console.log('--- issues (latest 3 ai) ---');
  for (const r of (iss ?? [])) console.log(r);
  const { data: sd } = await db.from('scored_drafts').select('id, channel, merged, attempt_count, claimed_at').eq('channel','ai').order('id', { ascending: false }).limit(15);
  console.log('--- scored_drafts (latest 15 ai) ---');
  for (const r of (sd ?? [])) console.log(r);
}
main().catch(e => { console.error(e); process.exit(1); });
