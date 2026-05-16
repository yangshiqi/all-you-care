import { createDb } from '../../src/lib/db.js';
const db = createDb();
async function main() {
  const r1 = await db.from('issues').delete().eq('id', 16);
  console.log('delete issues id=16:', r1.error?.message ?? 'ok');
  const r2 = await db.from('pre_publish').delete().eq('id', 4);
  console.log('delete pre_publish id=4:', r2.error?.message ?? 'ok');
  const r3 = await db.from('scored_drafts')
    .update({ merged: false, attempt_count: 0, claimed_at: null, claim_id: null })
    .eq('channel', 'ai');
  console.log('reset scored_drafts ai:', r3.error?.message ?? 'ok');
}
main().catch(e => { console.error(e); process.exit(1); });
