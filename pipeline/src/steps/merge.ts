// pipeline/src/steps/merge.ts
import type { StepContext, StepResult } from '../cli.js';
import { claim, commit, markFailed } from '../lib/db.js';
import { callLlm } from '../lib/llm.js';
import { loadPrompt } from '../lib/prompt.js';
import { pickCoverImage } from '../lib/coverImage.js';
import {
  parseScoredEvents,
  deduplicateEvents,
  type MergedEvent,
} from '../lib/eventDedup.js';

// ----- types ---------------------------------------------------------------

type Persona = 'creator' | 'engineer' | 'investor';

interface MergeMetaOutput {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  top_pick_ids: number[];
  top_picks_meta: Record<string, string>;
  persona_assignments: Record<string, Persona[]>;
}

// Legacy SNOW output (still a single LLM call producing markdown content).
interface LegacyMergeOutput {
  title: string;
  date?: string;
  summary?: string;
  tags?: string[];
  content?: string;
}

interface AiTopPick {
  title: string;
  description: string;
  links: string[];
  score: number;
  why_matters: string;
}
interface AiPersonaCard {
  title: string;
  description: string;
  links: string[];
  score: number;
}
interface AiGeneralItem {
  title: string;
  link: string;
}
interface AiCoverMeta {
  description: string | null;
  link: string | null;
}
interface AiFinalPayload {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  top_picks: AiTopPick[];
  by_persona: Record<Persona, AiPersonaCard[]>;
  general: AiGeneralItem[];
  cover: AiCoverMeta;
}

const PERSONA_KEYS: readonly Persona[] = ['creator', 'engineer', 'investor'];
const PERSONA_THRESHOLD = 6.5;

// ----- AI channel: deterministic dedup + small LLM metadata call ----------

async function runAiMerge(ctx: StepContext, claimedContents: string[], claimedIds: number[]) {
  const { channel, channelDir, db, log, dryRun } = ctx;

  // 1. parse + dedup all incoming events.
  const allEvents = claimedContents.flatMap((c) => parseScoredEvents(c));
  const merged = deduplicateEvents(allEvents);
  log.info(
    {
      event: 'merge_dedup',
      raw_event_count: allEvents.length,
      unique_event_count: merged.length,
    },
    'parsed + deduped events',
  );

  // 2. build a slim LLM payload — just id/title/score + 1-line description.
  const llmEvents = merged.map((e) => ({
    id: e.id,
    title: e.title,
    score: e.score,
    description: e.description.length > 100
      ? `${e.description.slice(0, 100)}…`
      : e.description,
  }));

  // 3. fetch recent issue titles (72h) — used by the LLM only as anti-dup ref.
  const oldCutoff = new Date(
    Date.now() - channel.windows.merge_old_lookback_hours * 3_600_000,
  ).toISOString();
  const { data: oldIssues, error: oldErr } = await db
    .from('issues')
    .select('title')
    .eq('channel', channel.name)
    .gte('published_at', oldCutoff)
    .order('published_at', { ascending: false })
    .limit(50);
  if (oldErr) log.warn({ event: 'merge_old_fetch_fail', err: oldErr.message }, '');
  const oldTitles = (oldIssues ?? []).map((r: { title: string }) => r.title);

  const payload = { events: llmEvents, old_titles: oldTitles };
  const prompt = await loadPrompt(channelDir, 'merge', {
    json_payload: JSON.stringify(payload),
  });

  if (dryRun) {
    log.info(
      {
        event: 'dry_run',
        would_merge: claimedIds.length,
        unique_events: merged.length,
        old_titles: oldTitles.length,
      },
      '',
    );
    for (const id of claimedIds) await markFailed.scoredDraft(db, id, 'dry_run_release');
    return;
  }

  // 4. small LLM call — metadata only. Lower max_tokens; input is ~5-10x smaller now.
  const llm = await callLlm<MergeMetaOutput>({
    prompt,
    expectJson: true,
    model: channel.llm.model,
    maxTokens: channel.llm.max_tokens,
    temperature: channel.llm.temperature,
    log,
  });
  const meta = llm.json;
  if (!meta) throw new Error('merge LLM returned no JSON');

  // 5. assemble the final payload deterministically.
  const eventsById = new Map<number, MergedEvent>();
  for (const e of merged) eventsById.set(e.id, e);

  const topPickIds = Array.isArray(meta.top_pick_ids) ? meta.top_pick_ids : [];
  const topPicks: AiTopPick[] = [];
  for (const id of topPickIds) {
    const e = eventsById.get(id);
    if (!e) {
      log.warn({ event: 'merge_top_pick_unknown_id', id }, 'LLM picked unknown id');
      continue;
    }
    topPicks.push({
      title: e.title,
      description: e.description,
      links: e.links,
      score: e.score,
      why_matters: meta.top_picks_meta?.[String(id)] ?? '',
    });
  }

  const byPersona: Record<Persona, AiPersonaCard[]> = {
    creator: [],
    engineer: [],
    investor: [],
  };
  const personaAssignments = meta.persona_assignments ?? {};
  const topPickIdSet = new Set(topPickIds);
  let unassignedHigh = 0;
  let multiPersonaCollapsed = 0;
  for (const e of merged) {
    if (e.score < PERSONA_THRESHOLD) continue;
    if (topPickIdSet.has(e.id)) continue; // already shown in 必看, skip persona buckets
    const tags = personaAssignments[String(e.id)] ?? [];
    if (tags.length === 0) {
      unassignedHigh++;
      log.warn(
        { event: 'merge_persona_missing', id: e.id, title: e.title, score: e.score },
        'high-score event without persona assignment',
      );
      continue;
    }
    // Enforce single-persona: each event lives in exactly one bucket. If the
    // LLM ignored the prompt rule and returned multiple, take the first valid.
    const primary = tags.find((p) => PERSONA_KEYS.includes(p));
    if (!primary) continue;
    if (tags.length > 1) {
      multiPersonaCollapsed++;
      log.warn(
        { event: 'merge_persona_multi_collapsed', id: e.id, tags, kept: primary },
        'LLM returned multiple personas; kept first valid',
      );
    }
    byPersona[primary].push({
      title: e.title,
      description: e.description,
      links: e.links,
      score: e.score,
    });
  }
  for (const p of PERSONA_KEYS) {
    byPersona[p].sort((a, b) => b.score - a.score);
  }

  const general: AiGeneralItem[] = merged
    .filter((e) => e.score < PERSONA_THRESHOLD)
    .map((e) => ({ title: e.title, link: e.links[0] ?? '' }))
    .sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'));

  const cover = await pickCoverImage(db, channel, channel.name, log);
  const finalPayload: AiFinalPayload = {
    title: meta.title,
    date: meta.date,
    summary: meta.summary,
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    top_picks: topPicks,
    by_persona: byPersona,
    general,
    cover: { description: cover.description, link: cover.link },
  };

  const newId = await commit.merge(db, channel.name, {
    title: meta.title,
    summary: meta.summary ?? null,
    contentMd: JSON.stringify(finalPayload),
    tags: finalPayload.tags,
    coverImage: cover.url,
    sourceScoredIds: claimedIds,
  });
  log.info(
    {
      event: 'merge_ok',
      pre_publish_id: newId,
      source_count: claimedIds.length,
      unique_events: merged.length,
      top_picks: topPicks.length,
      creator: byPersona.creator.length,
      engineer: byPersona.engineer.length,
      investor: byPersona.investor.length,
      general: general.length,
      unassigned_high_score: unassignedHigh,
      multi_persona_collapsed: multiPersonaCollapsed,
    },
    '',
  );
}

// ----- SNOW channel: untouched legacy single-LLM flow ----------------------

async function runLegacyMerge(
  ctx: StepContext,
  claimedContents: string[],
  claimedIds: number[],
) {
  const { channel, channelDir, db, log, dryRun } = ctx;

  const oldCutoff = new Date(
    Date.now() - channel.windows.merge_old_lookback_hours * 3_600_000,
  ).toISOString();
  const { data: oldRows, error: oldErr } = await db
    .from('scored_drafts')
    .select('id, content')
    .eq('channel', channel.name)
    .eq('published', true)
    .gte('created_at', oldCutoff)
    .order('created_at', { ascending: false })
    .limit(100);
  if (oldErr) log.warn({ event: 'merge_old_fetch_fail', err: oldErr.message }, '');

  const oldDigest = (oldRows ?? []).map((r: { id: number; content: string }) => {
    const titleM = r.content.match(/####\s+(.+)/);
    return {
      title: titleM?.[1]?.trim() ?? '(no title)',
      summary: r.content.slice(0, 200).replace(/\s+/g, ' ').trim(),
    };
  });
  const payload = { new: claimedContents, old: oldDigest };
  const prompt = await loadPrompt(channelDir, 'merge', {
    json_payload: JSON.stringify(payload),
  });

  if (dryRun) {
    log.info({ event: 'dry_run', would_merge: claimedIds.length, old_ref: oldDigest.length }, '');
    for (const id of claimedIds) await markFailed.scoredDraft(db, id, 'dry_run_release');
    return;
  }

  const llm = await callLlm<LegacyMergeOutput>({
    prompt,
    expectJson: true,
    model: channel.llm.model,
    maxTokens: channel.llm.max_tokens,
    temperature: channel.llm.temperature,
    log,
  });
  const out = llm.json;
  if (!out) throw new Error('merge LLM returned no JSON');
  const cover = await pickCoverImage(db, channel, channel.name, log);
  const newId = await commit.merge(db, channel.name, {
    title: out.title,
    summary: out.summary ?? null,
    contentMd: out.content ?? '',
    tags: out.tags ?? [],
    coverImage: cover.url,
    sourceScoredIds: claimedIds,
  });
  log.info(
    { event: 'merge_ok', pre_publish_id: newId, source_count: claimedIds.length },
    '',
  );
}

// ----- entrypoint ----------------------------------------------------------

export async function run(ctx: StepContext): Promise<StepResult> {
  const { channel, db, log } = ctx;

  const claimed = await claim.forMerge(db, channel.name, 50);
  if (claimed.length === 0) {
    return { processed: 0, skipped: 0, failed: 0, notes: 'nothing to merge' };
  }

  const claimedIds = claimed.map((c) => c.id);
  const claimedContents = claimed.map((c) => c.content);

  let processed = 0;
  let failed = 0;
  try {
    if (channel.name === 'ai') {
      await runAiMerge(ctx, claimedContents, claimedIds);
    } else {
      await runLegacyMerge(ctx, claimedContents, claimedIds);
    }
    processed = claimedIds.length;
  } catch (e) {
    failed = claimedIds.length;
    const msg = (e as Error).message;
    log.error({ event: 'merge_fail', err: msg }, 'merge failed');
    for (const id of claimedIds) await markFailed.scoredDraft(db, id, msg);
  }
  return { processed, skipped: 0, failed, notes: `claimed ${claimedIds.length}` };
}
