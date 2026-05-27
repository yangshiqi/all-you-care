// pipeline/src/steps/score.ts
import type { StepContext, StepResult } from '../cli.js';
import { resolveLlm } from '../channels/types.js';
import { claim, commit, markFailed } from '../lib/db.js';
import { callLlm } from '../lib/llm.js';
import { loadPrompt, wrapUntrustedItems } from '../lib/prompt.js';
import { trackUsage } from '../lib/usage.js';

export async function run(ctx: StepContext): Promise<StepResult> {
  const { channel, channelDir, db, log, dryRun } = ctx;
  const limit = ctx.limit ?? channel.thresholds.score_batch_size;

  const drafts = await claim.forScore(db, channel.name, limit);
  const llmCfg = resolveLlm(channel, 'score');
  let processed = 0, failed = 0;

  for (const d of drafts) {
    try {
      const items_xml = wrapUntrustedItems([{ source: `draft-${d.id}`, content: d.content }]);
      const prompt = await loadPrompt(channelDir, 'score', { items_xml });
      if (dryRun) {
        log.info({ event: 'dry_run', would_score_draft: d.id }, '');
        await markFailed.draft(db, d.id, 'dry_run_release');
        continue;
      }
      const result = await callLlm({
        prompt,
        model: llmCfg.model,
        maxTokens: llmCfg.maxTokens,
        temperature: llmCfg.temperature,
        log,
      });
      await trackUsage(db, { channel: channel.name, step: 'score', provider: 'anthropic', model: llmCfg.model, input_tokens: result.inputTokens, output_tokens: result.outputTokens }, log);
      const newId = await commit.score(db, channel.name, d.id, result.text);
      log.info({ event: 'score_ok', draft_id: d.id, scored_id: newId }, '');
      processed++;
    } catch (e) {
      const msg = (e as Error).message;
      failed++;
      log.warn({ event: 'score_fail', draft_id: d.id, err: msg }, '');
      await markFailed.draft(db, d.id, msg);
    }
  }
  return { processed, skipped: 0, failed, notes: `claimed ${drafts.length}` };
}
