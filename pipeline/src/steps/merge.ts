// pipeline/src/steps/merge.ts
import type { StepContext, StepResult } from '../cli.js';
import { claim, commit, markFailed } from '../lib/db.js';
import { callLlm } from '../lib/llm.js';
import { loadPrompt } from '../lib/prompt.js';
import { pickCoverImage } from '../lib/coverImage.js';

interface MergeOutput {
  title: string;
  summary: string;
  tags: string[];
  content: string;
}

export async function run(ctx: StepContext): Promise<StepResult> {
  const { channel, channelDir, db, log, dryRun } = ctx;

  // 1. claim all unmerged scored_drafts (could be multiple)
  const claimed = await claim.forMerge(db, channel.name, 50);
  if (claimed.length === 0) {
    return { processed: 0, skipped: 0, failed: 0, notes: 'nothing to merge' };
  }

  // 2. read recent N hours of "old" (already published) for dedup ref; only title + summary to keep tokens small
  const oldCutoff = new Date(Date.now() - channel.windows.merge_old_lookback_hours * 3_600_000).toISOString();
  const { data: oldRows, error: oldErr } = await db.from('scored_drafts')
    .select('id, content')
    .eq('channel', channel.name)
    .eq('published', true)
    .gte('created_at', oldCutoff)
    .order('created_at', { ascending: false })
    .limit(100);
  if (oldErr) log.warn({ event: 'merge_old_fetch_fail', err: oldErr.message }, '');

  // old digest: take first heading + first paragraph snippet
  const oldDigest = (oldRows ?? []).map((r: { id: number; content: string }) => {
    const titleM = r.content.match(/####\s+(.+)/);
    return { title: titleM?.[1]?.trim() ?? '(no title)', summary: r.content.slice(0, 200).replace(/\s+/g, ' ').trim() };
  });

  const payload = {
    new: claimed.map(c => c.content),
    old: oldDigest,
  };

  let processed = 0, failed = 0;
  try {
    const prompt = await loadPrompt(channelDir, 'merge', { json_payload: JSON.stringify(payload) });
    if (dryRun) {
      log.info({ event: 'dry_run', would_merge: claimed.length, old_ref: oldDigest.length }, '');
      for (const c of claimed) await markFailed.scoredDraft(db, c.id, 'dry_run_release');
      return { processed: 0, skipped: claimed.length, failed: 0, notes: 'dry-run' };
    }
    const llm = await callLlm<MergeOutput>({
      prompt,
      expectJson: true,
      model: channel.llm.model,
      maxTokens: channel.llm.max_tokens,
      temperature: channel.llm.temperature,
      log,
    });
    const out = llm.json!;
    const cover = await pickCoverImage(db, channel, channel.name, log);
    const newId = await commit.merge(db, channel.name, {
      title: out.title,
      summary: out.summary ?? null,
      contentMd: out.content,
      tags: out.tags ?? [],
      coverImage: cover,
      sourceScoredIds: claimed.map(c => c.id),
    });
    log.info({ event: 'merge_ok', pre_publish_id: newId, source_count: claimed.length }, '');
    processed = claimed.length;
  } catch (e) {
    failed = claimed.length;
    const msg = (e as Error).message;
    log.error({ event: 'merge_fail', err: msg }, 'merge failed');
    for (const c of claimed) await markFailed.scoredDraft(db, c.id, msg);
  }
  return { processed, skipped: 0, failed, notes: `claimed ${claimed.length}` };
}
