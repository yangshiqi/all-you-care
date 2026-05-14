// pipeline/src/steps/deliver.ts
// Triggered by CLI or workflow_dispatch (admin button uses /api/admin/deliver, not this).
// `pipeline ai deliver` defaults to "newest undelivered issue".

import type { StepContext, StepResult } from '../cli.js';
import type { IssueRow } from '../lib/db.js';

export async function run(ctx: StepContext): Promise<StepResult> {
  const { channel, db, log, dryRun } = ctx;

  // CLAIM: 5-min delivering_at lock
  const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
  const { data: claimedRows, error: claimErr } = await db.from('issues')
    .update({ delivering_at: new Date().toISOString() } as never)
    .eq('channel', channel.name)
    .eq('delivered', false)
    .or(`delivering_at.is.null,delivering_at.lt.${fiveMinAgo}`)
    .order('published_at', { ascending: false })
    .limit(1)
    .select('*');
  if (claimErr) {
    log.error({ event: 'deliver_claim_fail', err: claimErr.message }, '');
    return { processed: 0, skipped: 0, failed: 1, notes: claimErr.message };
  }
  const issue = (claimedRows as IssueRow[] | null)?.[0];
  if (!issue) {
    log.info({ event: 'deliver_skip' }, 'nothing pending');
    return { processed: 0, skipped: 0, failed: 0, notes: 'nothing pending' };
  }

  if (dryRun) {
    log.info({ event: 'dry_run', would_deliver: issue.id, url: channel.deliver.url }, '');
    await db.from('issues').update({ delivering_at: null } as never).eq('id', issue.id);
    return { processed: 0, skipped: 1, failed: 0, notes: 'dry-run' };
  }

  // SAFETY GATE: deliver default to dry-run unless DELIVER_LIVE=1.
  // Prevents accidental real sends to subscribers during dev / staging.
  if (process.env.DELIVER_LIVE !== '1') {
    log.warn({
      event: 'deliver_dry_safety',
      issue_id: issue.id,
      url: channel.deliver.url,
    }, 'DELIVER_LIVE != 1 — skipping real fetch, marking delivered anyway for UI consistency');
    await db.from('issues').update({
      delivered: true,
      delivered_at: new Date().toISOString(),
      delivering_at: null,
    } as never).eq('id', issue.id);
    return { processed: 1, skipped: 0, failed: 0, notes: 'dry-safety (DELIVER_LIVE!=1)' };
  }

  // CALL deliver url
  try {
    const resp = await fetch(channel.deliver.url, { method: 'GET', signal: AbortSignal.timeout(30_000) });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
    await db.from('issues').update({
      delivered: true,
      delivered_at: new Date().toISOString(),
      delivering_at: null,
    } as never).eq('id', issue.id);
    log.info({ event: 'deliver_ok', issue_id: issue.id }, '');
    return { processed: 1, skipped: 0, failed: 0, notes: '' };
  } catch (e) {
    const msg = (e as Error).message;
    await db.from('issues').update({
      delivering_at: null,
      delivery_attempt_count: (issue.delivery_attempt_count ?? 0) + 1,
      delivery_last_error: msg.slice(0, 1000),
    } as never).eq('id', issue.id);
    log.error({ event: 'deliver_fail', issue_id: issue.id, err: msg }, '');
    return { processed: 0, skipped: 0, failed: 1, notes: msg };
  }
}
