import type { StepContext } from '../cli.js';
import { resolveLlm } from '../channels/types.js';
import { claim, commit, markFailed } from '../lib/db.js';
import { callLlm } from '../lib/llm.js';
import { loadPrompt } from '../lib/prompt.js';
import { trackUsage } from '../lib/usage.js';
import { todayCst } from '../lib/time.js';
import { normalizeTitle, fuzzyEquivalent } from '../lib/eventDedup.js';
import {
  INFRA_CATEGORY_ORDER,
  parseInfraScoredItems,
  type InfraScoredItem,
  type InfraCategoryKey,
  type InfraReportItem,
  type InfraReportCategory,
  type InfraWeeklyPayload,
  type InfraRecommendation,
} from '../lib/infraTypes.js';

/** Row-level 7-day window proxy (scored_drafts.created_at). */
export function withinDays(iso: string, now: Date, days: number): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return now.getTime() - t <= days * 86_400_000;
}

function unionSources(
  a: InfraScoredItem['sources'],
  b: InfraScoredItem['sources'],
): InfraScoredItem['sources'] {
  const seen = new Set(a.map((s) => s.url));
  const out = [...a];
  for (const s of b) if (!seen.has(s.url)) { seen.add(s.url); out.push(s); }
  return out;
}

/** Merge items with equal/fuzzy-equal titles: keep higher score + richer facts, union sources. */
export function dedupInfraItems(items: InfraScoredItem[]): InfraScoredItem[] {
  const kept: InfraScoredItem[] = [];
  for (const it of items) {
    const norm = normalizeTitle(it.title);
    const hit = kept.find(
      (k) => normalizeTitle(k.title) === norm || fuzzyEquivalent(k.title, it.title),
    );
    if (!hit) { kept.push({ ...it, sources: [...it.sources] }); continue; }
    if (it.score > hit.score) hit.score = it.score;
    if (it.facts.length > hit.facts.length) hit.facts = it.facts;
    hit.sources = unionSources(hit.sources, it.sources);
  }
  return kept;
}

export interface InfraBucket {
  key: InfraCategoryKey;
  label: string;
  empty: boolean;
  items: InfraScoredItem[];
}

/** Group into the 5 fixed categories, score-desc within each, capped at perCategoryMax. */
export function bucketAndSelect(items: InfraScoredItem[], perCategoryMax: number): InfraBucket[] {
  return INFRA_CATEGORY_ORDER.map(({ key, label }) => {
    const picked = items
      .filter((i) => i.category === key)
      .sort((a, b) => b.score - a.score)
      .slice(0, perCategoryMax);
    return { key, label, empty: picked.length === 0, items: picked };
  });
}

// ----- runInfraMerge --------------------------------------------------------

const PER_CATEGORY_MAX = 5;
const WEEK_DAYS = 7;

interface ExpandOut { what: string; problem: string; value: string; scenarios: string; pitfalls: string; }
interface SynthOut {
  headline: string; overview: string; trends: string[];
  recommendations: InfraRecommendation[]; summary: string; tags: string[];
}

function cnDate(iso: string): string {   // '2026-07-01' -> '7月1日'
  const m = parseInt(iso.slice(5, 7), 10);
  const d = parseInt(iso.slice(8, 10), 10);
  return `${m}月${d}日`;
}

/** Fallback prose when per-item expand fails: reuse facts so the issue still ships. */
function fallbackItem(it: InfraScoredItem): InfraReportItem {
  return {
    title: it.title, what: it.facts, problem: '', value: '', scenarios: '',
    pitfalls: '（本条自动降级：展开失败，仅保留事实摘要）',
    score: it.score, sources: it.sources, ...(it.kind ? { kind: it.kind } : {}),
  };
}

export async function runInfraMerge(ctx: StepContext): Promise<void> {
  const { channel, channelDir, db, log, dryRun, now } = ctx;
  const today = todayCst(now);

  // 1. Claim all pending scored_drafts; drop rows older than the weekly window
  //    for the REPORT, but still mark ALL claimed as merged so backlog is consumed.
  const claimed = await claim.forMerge(db, channel.name, 200);
  if (claimed.length === 0) { log.info({ event: 'infra_merge_empty' }, 'nothing to merge'); return; }
  const allIds = claimed.map((c) => c.id);
  const recentRows = claimed.filter((c) => withinDays(c.created_at, now, WEEK_DAYS));

  // 2. Parse + flatten + dedup.
  const parsed = recentRows.flatMap((r) => parseInfraScoredItems(r.content));
  const deduped = dedupInfraItems(parsed);
  const buckets = bucketAndSelect(deduped, PER_CATEGORY_MAX);
  const selected = buckets.flatMap((b) => b.items);
  log.info({ event: 'infra_merge_select', claimed: allIds.length, recent_rows: recentRows.length,
    parsed: parsed.length, deduped: deduped.length, selected: selected.length }, '');

  if (dryRun) {
    log.info({ event: 'dry_run', would_merge: allIds.length, selected: selected.length }, '');
    for (const id of allIds) await markFailed.scoredDraft(db, id, 'dry_run_release');
    return;
  }

  // No items survived the weekly window + parse + bucket: don't burn a synthesize call
  // on a hollow all-empty issue. Release the claim (like dry-run) and return.
  if (selected.length === 0) {
    log.info({ event: 'infra_merge_no_selection', claimed: allIds.length, recent_rows: recentRows.length },
      'no items selected this week; releasing claim, no issue created');
    for (const id of allIds) await markFailed.scoredDraft(db, id, 'no_selection_release');
    return;
  }

  const llmCfg = resolveLlm(channel, 'merge');
  // Weekly window label as a date range: "6月25日 - 7月1日" (last 7 days, inclusive).
  const weekStartIso = new Date(Date.parse(today.date) - (WEEK_DAYS - 1) * 86_400_000)
    .toISOString().slice(0, 10);
  const weekLabel = `${cnDate(weekStartIso)} - ${cnDate(today.date)}`;

  // 3. Per-item expand (isolated: one failure → fallback, not a dead issue).
  const expandedByKey = new Map<string, InfraReportItem[]>();
  for (const b of buckets) {
    const out: InfraReportItem[] = [];
    for (const it of b.items) {
      try {
        const prompt = await loadPrompt(channelDir, 'merge.expand', { item_json: JSON.stringify(it) });
        const r = await callLlm<ExpandOut>({
          prompt, expectJson: true, model: llmCfg.model, maxTokens: 1200,
          temperature: llmCfg.temperature, chain: llmCfg.chain, log,
        });
        await trackUsage(db, { channel: channel.name, step: 'merge:expand', provider: r.provider,
          model: r.model, input_tokens: r.inputTokens, output_tokens: r.outputTokens }, log);
        const j = r.json;
        out.push(j
          ? { title: it.title, what: j.what ?? it.facts, problem: j.problem ?? '', value: j.value ?? '',
              scenarios: j.scenarios ?? '', pitfalls: j.pitfalls ?? '', score: it.score,
              sources: it.sources, ...(it.kind ? { kind: it.kind } : {}) }
          : fallbackItem(it));
      } catch (e) {
        log.warn({ event: 'infra_expand_fail', title: it.title, err: (e as Error).message }, '');
        out.push(fallbackItem(it));
      }
    }
    expandedByKey.set(b.key, out);
  }

  // 4. One synthesize call (compact input only).
  const synthInput = selected.map((i) => ({ title: i.title, category: i.category, score: i.score }));
  const synthPrompt = await loadPrompt(channelDir, 'merge.synthesize', {
    items_json: JSON.stringify(synthInput), week_label: weekLabel,
  });
  const s = await callLlm<SynthOut>({
    prompt: synthPrompt, expectJson: true, model: llmCfg.model, maxTokens: llmCfg.maxTokens,
    temperature: llmCfg.temperature, chain: llmCfg.chain, log,
  });
  await trackUsage(db, { channel: channel.name, step: 'merge', provider: s.provider, model: s.model,
    input_tokens: s.inputTokens, output_tokens: s.outputTokens }, log);
  const synth = s.json;
  if (!synth) throw new Error('infra merge: synthesize returned no JSON');

  // 5. Assemble deterministically.
  const categories: InfraReportCategory[] = buckets.map((b) => ({
    key: b.key, label: b.label,
    empty_note: b.empty ? '本周窗口内无可核验重大更新。' : null,
    items: expandedByKey.get(b.key) ?? [],
  }));
  const headline = (synth.headline || '').trim() || '云原生 × AI 融合本周动态';
  const title = `[AI 原生周报] ${weekLabel}：${headline}`;
  const payload: InfraWeeklyPayload = {
    title, week_label: weekLabel, headline,
    overview: synth.overview ?? '', summary: synth.summary ?? '',
    tags: Array.isArray(synth.tags) ? synth.tags : [],
    categories,
    trends: Array.isArray(synth.trends) ? synth.trends : [],
    recommendations: Array.isArray(synth.recommendations) ? synth.recommendations : [],
  };

  // No cover image for the infra weekly report (deliberately omitted).
  const newId = await commit.merge(db, channel.name, {
    title, summary: payload.summary || null, contentMd: JSON.stringify(payload),
    tags: payload.tags, coverImage: null, sourceScoredIds: allIds,
  });

  // 6. Tag as weekly (merge_commit defaults issue_type='daily'; no RPC change this round).
  const { error: upErr } = await db.from('pre_publish').update({ issue_type: 'weekly' }).eq('id', newId);
  if (upErr) log.warn({ event: 'infra_issue_type_fail', err: upErr.message, pre_publish_id: newId }, '');

  log.info({ event: 'infra_merge_ok', pre_publish_id: newId, title,
    categories: categories.map((c) => `${c.key}:${c.items.length}`).join(',') }, '');
}
