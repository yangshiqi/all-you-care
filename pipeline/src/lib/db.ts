import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type Channel = 'ai' | 'snow';
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

async function rpc<T>(db: SupabaseClient, name: string, args: object): Promise<T> {
  const { data, error } = await db.rpc(name, args);
  if (error) throw new Error(`rpc ${name} failed: ${error.message}`);
  return data as T;
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
