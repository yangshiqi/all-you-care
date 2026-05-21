// pipeline/src/steps/deliver.ts
// Triggered by CLI or workflow_dispatch (admin button uses /api/admin/deliver, not this).
// `pipeline ai deliver` defaults to "newest undelivered issue **from today (CST)**".
// Stale unsent issues are intentionally skipped — we don't want yesterday's
// digest landing in subscriber inboxes the day after.

import type { StepContext, StepResult } from '../cli.js';
import type { IssueRow } from '../lib/db.js';
import { todayCst } from '../lib/time.js';

export async function run(ctx: StepContext): Promise<StepResult> {
  const { channel, db, log, dryRun, now } = ctx;
  const today = todayCst(now);

  // CLAIM: 5-min delivering_at lock, restricted to issues published today (CST).
  // lang=zh_CN: the downstream Brevo route at /api/send-latest-ai-news only
  // dispatches zh_CN issues; claiming any other lang would mismatch.
  const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
  const { data: claimedRows, error: claimErr } = await db.from('issues')
    .update({ delivering_at: new Date().toISOString() } as never)
    .eq('channel', channel.name)
    .eq('lang', 'zh_CN')
    .eq('delivered', false)
    .gte('published_at', today.isoStart)
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
    // Observability: did we skip because no issue was published today, or
    // because there was a stale undelivered one we're now refusing to send?
    const { data: stale } = await db.from('issues')
      .select('id, title, published_at')
      .eq('channel', channel.name)
      .eq('delivered', false)
      .lt('published_at', today.isoStart)
      .order('published_at', { ascending: false })
      .limit(1);
    const staleRow = (stale as { id: number; title: string; published_at: string }[] | null)?.[0];
    if (staleRow) {
      log.warn({
        event: 'deliver_skip_stale',
        stale_id: staleRow.id,
        stale_title: staleRow.title,
        stale_published_at: staleRow.published_at,
        today: today.date,
      }, 'undelivered issue is older than today (CST); skipping');
      return { processed: 0, skipped: 1, failed: 0, notes: `stale undelivered issue ${staleRow.id} skipped` };
    }
    log.info({ event: 'deliver_skip', today: today.date }, 'no issue published today');
    return { processed: 0, skipped: 0, failed: 0, notes: 'nothing pending for today' };
  }

  if (dryRun) {
    log.info({ event: 'dry_run', would_deliver: issue.id, url: channel.deliver.url }, '');
    await db.from('issues').update({ delivering_at: null } as never).eq('id', issue.id);
    return { processed: 0, skipped: 1, failed: 0, notes: 'dry-run' };
  }

  // SAFETY GATE: real send only when DELIVER_LIVE=1.
  // Otherwise we release the claim and leave delivered=false untouched — earlier
  // versions used to flip delivered=true here "for UI consistency", which silently
  // poisoned dev/staging issues so they could never be sent in real production.
  if (process.env.DELIVER_LIVE !== '1') {
    log.warn({
      event: 'deliver_safety_gate',
      issue_id: issue.id,
      url: channel.deliver.url,
    }, 'DELIVER_LIVE != 1 — releasing claim, NOT marking delivered');
    await db.from('issues').update({ delivering_at: null } as never).eq('id', issue.id);
    return { processed: 0, skipped: 1, failed: 0, notes: 'safety-gate (DELIVER_LIVE!=1)' };
  }

  // CALL deliver url — pin the exact issue we just claimed, so the downstream
  // route can't independently re-pick a different "latest undelivered" row
  // and create a mismatch between what we claimed and what actually got sent.
  const targetUrl = new URL(channel.deliver.url);
  targetUrl.searchParams.set('issue_id', String(issue.id));
  // Hoist body/counts so the catch block can also persist what (if anything)
  // the route returned — useful for diagnosing route-reported failures.
  let parsedBody: unknown = null;
  let successCount: number | null = null;
  let failedCount: number | null = null;
  try {
    const resp = await fetch(targetUrl, { method: 'GET', signal: AbortSignal.timeout(30_000) });
    const bodyText = await resp.text();
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${bodyText.slice(0, 200)}`);

    // Parse the route's JSON body. Shape (see
    // src/app/api/send-latest-ai-news/route.ts):
    //   { success, results: [{ mode, success, error?, successCount?, failedCount?, ... }] }
    // The route returns HTTP 207 (Multi-Status, technically still 2xx and thus
    // resp.ok === true) when ANY mode fails — including the case where Brevo
    // 401's the recipient-list query and zero emails get sent. Checking only
    // resp.ok used to silently mark issues delivered=true in that scenario.
    let modeError: string | null = null;
    let bodySuccess = true;
    try {
      parsedBody = JSON.parse(bodyText);
      const root = parsedBody as { success?: unknown; results?: unknown };
      if (root.success === false) bodySuccess = false;
      const results = root.results;
      if (Array.isArray(results)) {
        const ours = results.find(
          (r) => typeof r === 'object' && r !== null && (r as { mode?: unknown }).mode === channel.name,
        ) ?? results[0];
        if (ours && typeof ours === 'object') {
          const r = ours as { success?: unknown; error?: unknown; successCount?: unknown; failedCount?: unknown };
          if (typeof r.successCount === 'number') successCount = r.successCount;
          if (typeof r.failedCount === 'number') failedCount = r.failedCount;
          if (r.success === false) bodySuccess = false;
          if (typeof r.error === 'string') modeError = r.error;
        }
      }
    } catch {
      log.warn({ event: 'deliver_response_parse_fail', issue_id: issue.id, head: bodyText.slice(0, 200) }, '');
      // On HTTP 207 the route is telling us SOMETHING failed inside; the body
      // is the only source of truth about which mode/why. If we can't parse
      // it, we cannot prove success — treat as failure rather than optimistically
      // marking delivered=true. 200 + unparseable body is a rarer mid-flight
      // truncation scenario where the route most likely succeeded, so we stay
      // optimistic there.
      if (resp.status === 207) bodySuccess = false;
    }

    if (!bodySuccess) {
      throw new Error(
        `route reported failure (HTTP ${resp.status}): ${modeError ?? bodyText.slice(0, 200)}`,
      );
    }

    await db.from('issues').update({
      delivered: true,
      delivered_at: new Date().toISOString(),
      delivering_at: null,
      delivery_success_count: successCount,
      delivery_failed_count: failedCount,
      delivery_response: parsedBody,
    } as never).eq('id', issue.id);

    log.info({
      event: 'deliver_ok',
      issue_id: issue.id,
      url: targetUrl.toString(),
      success_count: successCount,
      failed_count: failedCount,
    }, '');
    if ((failedCount ?? 0) > 0) {
      log.warn({
        event: 'deliver_partial',
        issue_id: issue.id,
        success_count: successCount,
        failed_count: failedCount,
      }, 'route reported success but some recipients failed — see delivery_response for per-email errors');
    }
    return { processed: 1, skipped: 0, failed: 0, notes: '' };
  } catch (e) {
    const msg = (e as Error).message;
    // Persist whatever response body we managed to parse, even on failure.
    // Network-level errors (no response) leave delivery_response NULL.
    await db.from('issues').update({
      delivering_at: null,
      delivery_attempt_count: (issue.delivery_attempt_count ?? 0) + 1,
      delivery_last_error: msg.slice(0, 1000),
      delivery_success_count: successCount,
      delivery_failed_count: failedCount,
      delivery_response: parsedBody,
    } as never).eq('id', issue.id);
    log.error({ event: 'deliver_fail', issue_id: issue.id, err: msg }, '');
    return { processed: 0, skipped: 0, failed: 1, notes: msg };
  }
}
