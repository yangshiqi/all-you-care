// pipeline/src/steps/merge.ts
import type { StepContext, StepResult } from '../cli.js';
import { resolveLlm } from '../channels/types.js';
import { claim, commit, markFailed } from '../lib/db.js';
import { callLlm } from '../lib/llm.js';
import { loadPrompt } from '../lib/prompt.js';
import { pickCoverImage } from '../lib/coverImage.js';
import { todayCst } from '../lib/time.js';
import {
  parseScoredEvents,
  deduplicateEvents,
  normalizeTitle,
  fuzzyEquivalent,
  descriptionsLikelySameEvent,
  findContainerUrls,
  urlMatchCorroborated,
  type MergedEvent,
} from '../lib/eventDedup.js';
import { embedTexts, cosineSimilarity } from '../lib/embedding.js';
import { trackUsage } from '../lib/usage.js';
import { toPersonaTags } from '../lib/persona.js';
import { runInfraMerge } from './infraMerge.js';

// ----- types ---------------------------------------------------------------

type Persona = 'creator' | 'engineer' | 'investor';

interface MergeMetaOutput {
  headline: string;
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
  const { channel, channelDir, db, log, dryRun, now } = ctx;
  const today = todayCst(now);
  // Chinese-style M月D日 with no leading zeros (e.g., "5月21日").
  const cnMonth = parseInt(today.date.slice(5, 7), 10);
  const cnDay = parseInt(today.date.slice(8, 10), 10);
  const cnDateLabel = `${cnMonth}月${cnDay}日`;

  // 1. parse + dedup all incoming events (within-issue).
  const allEvents = claimedContents.flatMap((c) => parseScoredEvents(c));
  const withinDeduped = deduplicateEvents(allEvents);
  log.info(
    {
      event: 'merge_dedup',
      raw_event_count: allEvents.length,
      unique_event_count: withinDeduped.length,
    },
    'parsed + deduped events (within-issue)',
  );

  // 1b. Cross-issue dedup: drop events already published in recent issues.
  // Same news from different sources can arrive days apart (TechCrunch on day 1,
  // VentureBeat newsletter on day 2). Within-issue dedup catches same-batch dups
  // but can't see what shipped in prior issues. We extract event titles from
  // recent issues' structured JSON payload and filter today's events against them
  // using the same 4-layer matching (exact title, URL overlap, fuzzy title,
  // description similarity).
  const oldCutoffForDedup = new Date(
    Date.now() - channel.windows.merge_old_lookback_hours * 3_600_000,
  ).toISOString();
  const { data: recentPp } = await db.from('pre_publish')
    .select('content_md')
    .eq('channel', channel.name)
    .eq('published', true)
    .gte('created_at', oldCutoffForDedup)
    .lt('created_at', today.isoStart)
    .order('created_at', { ascending: false })
    .limit(10);

  interface PhantomEvent { title: string; description: string; links: string[] }
  const phantoms: PhantomEvent[] = [];
  for (const row of (recentPp ?? []) as { content_md: string }[]) {
    try {
      const p = JSON.parse(row.content_md) as AiFinalPayload;
      for (const tp of p.top_picks ?? []) {
        phantoms.push({ title: tp.title, description: tp.description, links: tp.links ?? [] });
      }
      for (const pKey of PERSONA_KEYS) {
        for (const card of p.by_persona?.[pKey] ?? []) {
          phantoms.push({ title: card.title, description: card.description, links: card.links ?? [] });
        }
      }
      for (const g of p.general ?? []) {
        phantoms.push({ title: g.title, description: '', links: g.link ? [g.link] : [] });
      }
    } catch { /* not JSON (snow legacy) — skip */ }
  }

  // Container URLs are computed over today's events *and* the phantom pool: a
  // digest link that carried ten stories yesterday still carries ten today, and
  // a bare URL match against it would silently drop every one of them.
  const crossContainerUrls = findContainerUrls([
    ...withinDeduped.map(e => ({ title: e.title, description: e.description, links: e.links, score: e.score })),
    ...phantoms.map(ph => ({ title: ph.title, description: ph.description, links: ph.links, score: 0 })),
  ]);

  const crossDupTitles: string[] = [];
  let merged = phantoms.length > 0
    ? withinDeduped.filter((e) => {
        const eNorm = normalizeTitle(e.title);
        for (const ph of phantoms) {
          if (eNorm === normalizeTitle(ph.title)) { crossDupTitles.push(e.title); return false; }
          // A shared URL only drops the event when similarity corroborates it —
          // otherwise one digest link in yesterday's issue erases today's news.
          if (e.links.some(u => !crossContainerUrls.has(u) && ph.links.includes(u)) &&
              urlMatchCorroborated(
                { title: e.title, description: e.description },
                { title: ph.title, description: ph.description },
              )) { crossDupTitles.push(e.title); return false; }
          if (fuzzyEquivalent(e.title, ph.title)) { crossDupTitles.push(e.title); return false; }
          if (e.description.length >= 30 && ph.description.length >= 30 &&
              descriptionsLikelySameEvent(
                { title: e.title, description: e.description },
                { title: ph.title, description: ph.description },
              )) { crossDupTitles.push(e.title); return false; }
        }
        return true;
      })
    : withinDeduped;

  if (crossDupTitles.length > 0) {
    log.info(
      {
        event: 'merge_cross_issue_dedup',
        dropped: crossDupTitles.length,
        phantom_pool: phantoms.length,
        remaining: merged.length,
        dropped_titles: crossDupTitles.slice(0, 10),
      },
      'dropped events already published in recent issues',
    );
  }

  // 1c. Embedding-based semantic dedup (5th layer).
  // Rule-based matching has blind spots for paraphrased titles with different
  // numbers, transliterations, etc. Embeddings catch these by comparing meaning.
  const embedCfg = channel.embedding;
  const embeddingsToStore: { title: string; description: string; vec: number[] }[] = [];

  if (embedCfg && !process.env.GEMINI_API_KEY) {
    log.warn(
      { event: 'embed_skip_no_key' },
      'embedding configured but GEMINI_API_KEY not set; skipping semantic dedup',
    );
  }

  if (embedCfg && process.env.GEMINI_API_KEY) {
    try {
      const threshold = embedCfg.similarity_threshold;

      const texts = merged.map(
        (e) => `${e.title} — ${e.description.slice(0, 200)}`,
      );
      const { embeddings: vecs } = await embedTexts(texts, {
        model: embedCfg.model,
        log,
      });
      const embedTokensEst = texts.reduce((s, t) => s + Math.ceil(t.length / 4), 0);
      await trackUsage(db, { channel: channel.name, step: 'merge:embed', provider: 'gemini', model: embedCfg.model, input_tokens: embedTokensEst, output_tokens: 0 }, log);
      log.info(
        { event: 'embed_ok', count: vecs.length, dims: vecs[0]?.length },
        'generated event embeddings',
      );

      // Cross-issue: compare against stored embeddings from recent issues.
      const { data: storedRows, error: fetchErr } = await db
        .from('event_embeddings')
        .select('title, embedding')
        .eq('channel', channel.name)
        .gte('created_at', oldCutoffForDedup)
        .lt('created_at', today.isoStart);
      if (fetchErr) {
        log.warn({ event: 'embed_fetch_fail', err: fetchErr.message }, 'failed to fetch event embeddings');
      }
      const stored = (storedRows ?? []).map((row: { title: string; embedding: unknown }) => ({
        title: row.title,
        embedding: typeof row.embedding === 'string'
          ? JSON.parse(row.embedding) as number[]
          : row.embedding as number[],
      }));

      const embCrossDrop: string[] = [];
      const crossSurvivors: { event: MergedEvent; vec: number[] }[] = [];
      for (let i = 0; i < merged.length; i++) {
        const e = merged[i]!;
        const v = vecs[i]!;
        let hit = false;
        for (const s of stored) {
          if (cosineSimilarity(v, s.embedding) >= threshold) {
            embCrossDrop.push(`${e.title} ≈ ${s.title}`);
            hit = true;
            break;
          }
        }
        if (!hit) crossSurvivors.push({ event: e, vec: v });
      }
      if (embCrossDrop.length > 0) {
        log.info(
          {
            event: 'embed_cross_dedup',
            dropped: embCrossDrop.length,
            stored_pool: stored.length,
            remaining: crossSurvivors.length,
            samples: embCrossDrop.slice(0, 5),
          },
          'dropped events by embedding similarity to recent issues',
        );
      }

      // Within-issue: pairwise similarity among survivors.
      const embWithinDrop: string[] = [];
      const kept: { event: MergedEvent; vec: number[] }[] = [];
      for (const item of crossSurvivors) {
        let mergedInto = false;
        for (const k of kept) {
          if (cosineSimilarity(item.vec, k.vec) >= threshold) {
            if (item.event.score > k.event.score) k.event.score = item.event.score;
            if (item.event.description.length > k.event.description.length) {
              k.event.description = item.event.description;
            }
            for (const u of item.event.links) {
              if (!k.event.links.includes(u)) k.event.links.push(u);
            }
            k.event.source_count += item.event.source_count;
            embWithinDrop.push(`${item.event.title} ≈ ${k.event.title}`);
            mergedInto = true;
            break;
          }
        }
        if (!mergedInto) kept.push(item);
      }
      if (embWithinDrop.length > 0) {
        log.info(
          {
            event: 'embed_within_dedup',
            merged_count: embWithinDrop.length,
            remaining: kept.length,
            samples: embWithinDrop.slice(0, 5),
          },
          'merged within-issue events by embedding similarity',
        );
      }

      // Reassign merged with fresh sequential IDs.
      merged = kept.map((k, i) => ({ ...k.event, id: i + 1 }));
      for (const k of kept) {
        embeddingsToStore.push({
          title: k.event.title,
          description: k.event.description.slice(0, 500),
          vec: k.vec,
        });
      }
    } catch (err) {
      log.warn(
        { event: 'embed_dedup_skip', err: (err as Error).message },
        'embedding dedup failed, continuing with rule-based results',
      );
    }
  }

  // 2. build a slim LLM payload — just id/title/score + 1-line description.
  // Drop low-score noise: the LLM only decides top_picks + persona_assignments,
  // both of which only consider score >= PERSONA_THRESHOLD. Anything well below
  // that goes straight to the deterministic `general` bucket and doesn't need
  // to burn LLM input tokens.
  const LLM_PAYLOAD_FLOOR = PERSONA_THRESHOLD - 0.5; // small buffer for surprise top-picks
  const llmEvents = merged
    .filter((e) => e.score >= LLM_PAYLOAD_FLOOR)
    .map((e) => ({
      id: e.id,
      title: e.title,
      score: e.score,
      description: e.description.length > 100
        ? `${e.description.slice(0, 100)}…`
        : e.description,
    }));
  log.info(
    {
      event: 'merge_payload_trim',
      total: merged.length,
      sent_to_llm: llmEvents.length,
      floor: LLM_PAYLOAD_FLOOR,
    },
    'trimmed low-score events from llm payload',
  );

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
    today_date: today.date,
    weekday: today.weekday,
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
  const llmCfg = resolveLlm(channel, 'merge');
  const llm = await callLlm<MergeMetaOutput>({
    prompt,
    expectJson: true,
    model: llmCfg.model,
    maxTokens: llmCfg.maxTokens,
    temperature: llmCfg.temperature,
    chain: llmCfg.chain,
    log,
  });
  await trackUsage(db, { channel: channel.name, step: 'merge', provider: llm.provider, model: llm.model, input_tokens: llm.inputTokens, output_tokens: llm.outputTokens }, log);
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
    // Providers don't always honor the Persona[] shape (Gemini, used as a
    // fallback, has returned a bare string). Normalize so .find/.length below
    // can't throw — see toPersonaTags / the 2026-06-05 outage.
    const tags = toPersonaTags(personaAssignments[String(e.id)]);
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
    const primary = tags.find((p): p is Persona => (PERSONA_KEYS as readonly string[]).includes(p));
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

  // Compose the email-subject-style title. headline is required; if the LLM
  // forgets it (rare), fall back to a generic phrase so the morning paper
  // still ships rather than crashes.
  let headline = typeof meta.headline === 'string' ? meta.headline.trim() : '';
  if (!headline) {
    log.warn({ event: 'merge_missing_headline', pre_publish_today: today.date }, 'LLM did not return a headline; using fallback');
    headline = '今日 AI 行业要闻';
  }
  const issueTitle = `[AI]news - ${cnDateLabel}新闻早报：${headline}`;

  const cover = await pickCoverImage(db, channel, channel.name, log);
  const finalPayload: AiFinalPayload = {
    title: issueTitle,
    date: today.date,
    summary: meta.summary,
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    top_picks: topPicks,
    by_persona: byPersona,
    general,
    cover: { description: cover.description, link: cover.link },
  };

  const newId = await commit.merge(db, channel.name, {
    title: issueTitle,
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
      title: issueTitle,
      date: today.date,
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

  // Store event embeddings for future cross-issue dedup.
  if (embeddingsToStore.length > 0) {
    const rows = embeddingsToStore.map((e) => ({
      channel: channel.name,
      pre_publish_id: newId,
      title: e.title,
      description: e.description,
      embedding: JSON.stringify(e.vec),
    }));
    const { error: insErr } = await db
      .from('event_embeddings')
      .insert(rows);
    if (insErr) {
      log.warn(
        { event: 'embed_store_fail', err: insErr.message },
        'failed to store event embeddings',
      );
    } else {
      log.info(
        { event: 'embed_store_ok', count: rows.length, pre_publish_id: newId },
        'stored event embeddings for future dedup',
      );
    }
  }
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

  const llmCfg = resolveLlm(channel, 'merge');
  const llm = await callLlm<LegacyMergeOutput>({
    prompt,
    expectJson: true,
    model: llmCfg.model,
    maxTokens: llmCfg.maxTokens,
    temperature: llmCfg.temperature,
    chain: llmCfg.chain,
    log,
  });
  await trackUsage(db, { channel: channel.name, step: 'merge', provider: llm.provider, model: llm.model, input_tokens: llm.inputTokens, output_tokens: llm.outputTokens }, log);
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
  const { channel, db, log, now } = ctx;
  const today = todayCst(now);

  // Idempotency guard: refuse to create a second pre_publish for the same CST
  // day. Without this, a manual `ai-publish` workflow_dispatch after the 08:30
  // cron silently builds a duplicate same-day issue from whatever scored_drafts
  // arrived in between (this is how issues 29 and pp 12 happened historically).
  // To force a regenerate, delete today's pre_publish row first.
  const { data: existing } = await db.from('pre_publish')
    .select('id, title, created_at')
    .eq('channel', channel.name)
    .gte('created_at', today.isoStart)
    .order('created_at', { ascending: false })
    .limit(1);
  const existingRow = (existing as { id: number; title: string; created_at: string }[] | null)?.[0];
  if (existingRow) {
    log.info({
      event: 'merge_skip_today_exists',
      existing_id: existingRow.id,
      existing_title: existingRow.title,
      existing_created_at: existingRow.created_at,
      today: today.date,
    }, 'today already has a merged issue for this channel; skipping');
    return {
      processed: 0,
      skipped: 0,
      failed: 0,
      notes: `today already merged as pre_publish ${existingRow.id}`,
    };
  }

  // infra: self-contained merge (own claim + JSON parse + expand + synthesize).
  if (channel.name === 'infra') {
    let processed = 0, failed = 0;
    try { await runInfraMerge(ctx); processed = 1; }
    catch (e) { failed = 1; log.error({ event: 'merge_fail', err: (e as Error).message }, 'infra merge failed'); }
    return { processed, skipped: 0, failed, notes: 'infra' };
  }

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
