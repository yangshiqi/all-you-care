// Reset ALL ai scored_drafts back to unmerged so the merge step can re-claim
// them. Does NOT touch pre_publish or issues — yesterday's pre_publish id=5
// stays intact. Safe to re-run.
import { createDb } from '../../src/lib/db.js';

const db = createDb();

async function main() {
  const { data: before } = await db
    .from('scored_drafts')
    .select('id, merged, attempt_count, claimed_at')
    .eq('channel', 'ai')
    .order('id', { ascending: false });
  console.log(`before reset: ${before?.length ?? 0} ai scored_drafts`);
  for (const r of (before ?? []).slice(0, 5)) console.log(' ', r);

  const { data: updated, error } = await db
    .from('scored_drafts')
    .update({ merged: false, attempt_count: 0, claimed_at: null, claim_id: null, last_error: null })
    .eq('channel', 'ai')
    .select('id');
  if (error) throw new Error(error.message);
  console.log(`\nreset ${updated?.length ?? 0} rows back to merged=false, attempt_count=0`);
}

main().catch((e) => { console.error(e); process.exit(1); });
