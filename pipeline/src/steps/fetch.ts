// pipeline/src/steps/fetch.ts
import type { StepContext, StepResult } from '../cli.js';
import * as rss from './fetchRss.js';
import * as email from './fetchEmail.js';

export async function run(ctx: StepContext): Promise<StepResult> {
  const r = await rss.run(ctx);
  const e = await email.run(ctx);
  return {
    processed: r.processed + e.processed,
    skipped:   r.skipped   + e.skipped,
    failed:    r.failed    + e.failed,
    notes: `rss: ${r.notes}, email: ${e.notes}`,
  };
}
