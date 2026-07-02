import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type Channel = 'ai' | 'snow' | 'infra';
export type Lang = 'zh_CN' | 'en';

export interface NewsItemRow {
  id: number;
  channel: Channel;
  source_type: 'rss' | 'email';
  source: string;
  title: string;
  content: string | null;
  link: string | null;
  link_canonical: string | null;
  pub_date: string | null;
  external_id: string | null;
  dedup_key: string;
  fetched_at: string;
  created_at: string;
  compressed: boolean;
  attempt_count: number;
  last_error: string | null;
  claimed_at: string | null;
  claim_id: string | null;
}

export interface DraftRow {
  id: number;
  channel: Channel;
  content: string;
  source_item_ids: number[];
  scored: boolean;
  attempt_count: number;
  last_error: string | null;
  created_at: string;
}

export interface ScoredDraftRow {
  id: number;
  channel: Channel;
  draft_id: number;
  content: string;
  merged: boolean;
  published: boolean;
  attempt_count: number;
  last_error: string | null;
  created_at: string;
}

export interface PrePublishRow {
  id: number;
  channel: Channel;
  title: string;
  summary: string | null;
  content_md: string;
  content_html: string | null;
  tags: string[];
  cover_image: string | null;
  source_scored_ids: number[];
  published: boolean;
  published_journal_id: number | null;
  attempt_count: number;
  last_error: string | null;
  created_at: string;
}

export interface IssueRow {
  id: number;
  channel: Channel;
  lang: Lang;
  title: string;
  summary: string | null;
  content_html: string;
  tags: string[];
  cover_image: string | null;
  journal_id: number | null;
  pre_publish_id: number | null;
  delivering_at: string | null;
  delivered: boolean;
  delivered_at: string | null;
  delivery_attempt_count: number;
  delivery_last_error: string | null;
  delivery_success_count: number | null;
  delivery_failed_count: number | null;
  delivery_response: unknown;
  created_at: string;
  published_at: string;
}

export function createDb(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// ----- RPC helper -----

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Transient (retriable) DB/network failures — the flaky-outbound-network class
 * (undici "fetch failed", connection resets, DNS blips, 502/503/504). A real
 * error (constraint violation, permission denied, SQL error) is NOT transient
 * and must surface immediately.
 */
export function isTransientDbError(msg: string | null | undefined): boolean {
  if (!msg) return false;
  // NB: no bare "network" — it matches real errors like "table network_logs".
  // "network timeout" is still caught by the `timeout` alternative.
  return /fetch failed|socket hang up|ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|timeout|\b50[234]\b/i.test(
    msg,
  );
}

const RPC_RETRY_DELAYS = [500, 1500, 4000]; // ms; up to 3 retries after the first try

// Retries only the transient-network class above. NOTE on idempotency: the
// commit RPCs (compress/score/merge) write rows, so a retry after a
// *response-side* drop could double-write. In practice observed failures are
// request-side (nothing committed — verified), duplicate drafts/scored get
// collapsed by merge's dedup, and merge has a same-CST-day guard that stops
// cross-run duplicate issues. Non-transient errors never retry.
async function rpc<T>(db: SupabaseClient, name: string, args: object): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    let errMsg: string | null = null;
    try {
      const { data, error } = await db.rpc(name, args);
      if (!error) return data as T;
      errMsg = error.message;
    } catch (e) {
      errMsg = (e as Error).message; // thrown network error (e.g. undici "fetch failed")
    }
    if (attempt >= RPC_RETRY_DELAYS.length || !isTransientDbError(errMsg)) {
      throw new Error(`rpc ${name} failed: ${errMsg}`);
    }
    await sleep(RPC_RETRY_DELAYS[attempt]!);
  }
}

// ----- claim wrappers -----

export const claim = {
  forCompress: (db: SupabaseClient, channel: Channel, limit: number) =>
    rpc<NewsItemRow[]>(db, 'claim_for_compress', { p_channel: channel, p_limit: limit }),
  forScore: (db: SupabaseClient, channel: Channel, limit: number) =>
    rpc<DraftRow[]>(db, 'claim_for_score', { p_channel: channel, p_limit: limit }),
  forMerge: (db: SupabaseClient, channel: Channel, limit: number) =>
    rpc<ScoredDraftRow[]>(db, 'claim_for_merge', { p_channel: channel, p_limit: limit }),
  forRender: (db: SupabaseClient, channel: Channel, limit: number) =>
    rpc<PrePublishRow[]>(db, 'claim_for_render', { p_channel: channel, p_limit: limit }),
  forPublish: (db: SupabaseClient, channel: Channel, limit: number) =>
    rpc<PrePublishRow[]>(db, 'claim_for_publish', { p_channel: channel, p_limit: limit }),
};

// ----- commit wrappers -----

export const commit = {
  compress: (db: SupabaseClient, channel: Channel, content: string, sourceIds: number[]) =>
    rpc<number>(db, 'compress_commit', {
      p_channel: channel, p_draft_content: content, p_source_ids: sourceIds,
    }),
  score: (db: SupabaseClient, channel: Channel, draftId: number, scored: string) =>
    rpc<number>(db, 'score_commit', {
      p_channel: channel, p_draft_id: draftId, p_scored_content: scored,
    }),
  merge: (db: SupabaseClient, channel: Channel, args: {
    title: string; summary: string | null; contentMd: string;
    tags: string[]; coverImage: string | null; sourceScoredIds: number[];
  }) => rpc<number>(db, 'merge_commit', {
    p_channel: channel,
    p_title: args.title,
    p_summary: args.summary,
    p_content_md: args.contentMd,
    p_tags: args.tags,
    p_cover_image: args.coverImage,
    p_source_scored_ids: args.sourceScoredIds,
  }),
  render: (db: SupabaseClient, prePublishId: number, contentHtml: string) =>
    rpc<void>(db, 'render_commit', {
      p_pre_publish_id: prePublishId, p_content_html: contentHtml,
    }),
  publish: (db: SupabaseClient, prePublishId: number, lang: Lang) =>
    rpc<number>(db, 'publish_commit', {
      p_pre_publish_id: prePublishId, p_lang: lang,
    }),
};

// ----- mark_failed wrappers -----

export const markFailed = {
  newsItem: (db: SupabaseClient, id: number, err: string) =>
    rpc<void>(db, 'mark_failed_news_item', { p_id: id, p_err: err.slice(0, 1000) }),
  draft: (db: SupabaseClient, id: number, err: string) =>
    rpc<void>(db, 'mark_failed_draft', { p_id: id, p_err: err.slice(0, 1000) }),
  scoredDraft: (db: SupabaseClient, id: number, err: string) =>
    rpc<void>(db, 'mark_failed_scored_draft', { p_id: id, p_err: err.slice(0, 1000) }),
  prePublish: (db: SupabaseClient, id: number, err: string) =>
    rpc<void>(db, 'mark_failed_pre_publish', { p_id: id, p_err: err.slice(0, 1000) }),
};
