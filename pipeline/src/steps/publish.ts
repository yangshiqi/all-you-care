// pipeline/src/steps/publish.ts
import type { StepContext, StepResult } from '../cli.js';
import { claim, commit, markFailed } from '../lib/db.js';
import { sendPreviewEmail } from '../lib/previewEmail.js';

export async function run(ctx: StepContext): Promise<StepResult> {
  const { channel, db, log, dryRun } = ctx;
  const claimed = await claim.forPublish(db, channel.name, 5);
  let processed = 0, failed = 0;

  for (const pp of claimed) {
    try {
      if (dryRun) {
        log.info({ event: 'dry_run', would_publish: pp.id }, '');
        await markFailed.prePublish(db, pp.id, 'dry_run_release');
        continue;
      }
      const issueId = await commit.publish(db, pp.id, 'zh_CN');
      log.info({ event: 'publish_ok', pre_publish_id: pp.id, issue_id: issueId }, '');
      processed++;

      // Fire-and-forget preview email (failure must not fail the publish).
      try {
        const { data: issue } = await db.from('issues')
          .select('id, title, content_html')
          .eq('id', issueId)
          .single();
        if (issue && issue.content_html) {
          await sendPreviewEmail(
            { id: issue.id, title: issue.title, content_html: issue.content_html },
            log,
          );
        }
      } catch (e) {
        log.warn({ event: 'preview_email_skip', issue_id: issueId, err: (e as Error).message }, '');
      }
    } catch (e) {
      const msg = (e as Error).message;
      failed++;
      log.warn({ event: 'publish_fail', pre_publish_id: pp.id, err: msg }, '');
      await markFailed.prePublish(db, pp.id, msg);
    }
  }
  return { processed, skipped: 0, failed, notes: `claimed ${claimed.length}` };
}
