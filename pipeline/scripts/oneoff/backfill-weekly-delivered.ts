// One-off: mark all past undelivered WEEKLY issues as delivered.
//
// Context: until now ai-weekly.yml had no `deliver` step, so weekly digests were
// published to the site but never emailed. We're now enabling weekly delivery
// (deliver job added to ai-weekly.yml). The deliver step only claims issues
// published *today* (CST), so historical weeklies would never be re-sent anyway —
// but we still flip them to delivered=true so the data reflects reality and a
// manual same-day re-trigger can't surface an old one.
//
// Usage (from pipeline/):
//   npx tsx --env-file=.env scripts/oneoff/backfill-weekly-delivered.ts           # dry-run: list only
//   npx tsx --env-file=.env scripts/oneoff/backfill-weekly-delivered.ts --apply   # perform the update
import { createDb } from '../../src/lib/db.js';

const db = createDb();
const APPLY = process.argv.includes('--apply');

async function main() {
  const { data: targets, error } = await db.from('issues')
    .select('id, channel, lang, title, published_at, delivered, issue_type')
    .eq('issue_type', 'weekly')
    .eq('delivered', false)
    .order('published_at', { ascending: true });
  if (error) throw new Error(error.message);

  console.log(`Found ${targets?.length ?? 0} undelivered weekly issue(s):`);
  for (const r of targets ?? []) {
    console.log(`  #${r.id} [${r.channel}/${r.lang}] ${r.published_at} — ${r.title}`);
  }

  if (!APPLY) {
    console.log('\nDry-run. Re-run with --apply to mark these delivered.');
    return;
  }
  if (!targets || targets.length === 0) {
    console.log('Nothing to update.');
    return;
  }

  const nowIso = new Date().toISOString();
  // Update exactly the IDs surfaced in the dry-run, not a blanket filter — so a
  // weekly published between this select and the update can't be silently marked
  // delivered without ever being sent.
  const targetIds = targets.map(t => t.id);
  const { data: updated, error: upErr } = await db.from('issues')
    .update({ delivered: true, delivered_at: nowIso, delivering_at: null })
    .in('id', targetIds)
    .select('id');
  if (upErr) throw new Error(upErr.message);
  console.log(`\nMarked ${updated?.length ?? 0} weekly issue(s) delivered at ${nowIso}.`);
}

main().catch(e => { console.error(e); process.exit(1); });
