// pipeline/src/steps/compress.ts
import type { StepContext, StepResult } from '../cli.js';
import { claim, commit, markFailed } from '../lib/db.js';
import { callLlm } from '../lib/llm.js';
import { loadPrompt, wrapUntrustedItems } from '../lib/prompt.js';

export async function run(ctx: StepContext): Promise<StepResult> {
  const { channel, channelDir, db, log, dryRun } = ctx;
  const limit = ctx.limit ?? channel.thresholds.compress_batch_size;

  const claimed = await claim.forCompress(db, channel.name, limit);
  if (claimed.length < channel.thresholds.compress_min_pending) {
    log.info({ event: 'compress_skip', count: claimed.length, min: channel.thresholds.compress_min_pending }, 'not enough pending, skip');
    // Release claim so next tick re-considers
    for (const it of claimed) await markFailed.newsItem(db, it.id, 'released_under_threshold');
    return { processed: 0, skipped: claimed.length, failed: 0, notes: 'under threshold' };
  }

  const items_xml = wrapUntrustedItems(claimed.map(c => ({
    source: `[${c.source}] ${c.title}`,
    content: `${c.content ?? ''}\n${c.link_canonical ?? c.link ?? ''}`,
  })));

  let processed = 0, failed = 0;
  try {
    const prompt = await loadPrompt(channelDir, 'compress', { items_xml });
    if (dryRun) {
      log.info({ event: 'dry_run', would_compress: claimed.length }, '');
      for (const it of claimed) await markFailed.newsItem(db, it.id, 'dry_run_release');
      return { processed: 0, skipped: claimed.length, failed: 0, notes: 'dry-run' };
    }
    const result = await callLlm({
      prompt,
      model: channel.llm.model,
      maxTokens: channel.llm.max_tokens,
      temperature: channel.llm.temperature,
      log,
    });
    const newDraftId = await commit.compress(
      db, channel.name, result.text, claimed.map(c => c.id),
    );
    log.info({ event: 'compress_ok', draft_id: newDraftId, source_count: claimed.length }, '');
    processed = claimed.length;
  } catch (e) {
    failed = claimed.length;
    const msg = (e as Error).message;
    log.error({ event: 'compress_fail', err: msg }, 'compress failed');
    for (const it of claimed) await markFailed.newsItem(db, it.id, msg);
  }
  return { processed, skipped: 0, failed, notes: `claimed ${claimed.length}` };
}
