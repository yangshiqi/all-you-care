-- All functions in 0002 + 0002a are SECURITY INVOKER (default).
-- They rely on the caller having direct table access (i.e., service-role key).
-- DO NOT call these via supabase.rpc() from the browser with anon/authenticated keys --
-- RLS will deny the underlying table writes and the functions will silently fail.
-- If you need browser callable RPCs later, create separate SECURITY DEFINER variants
-- with explicit revoke/grant.

-- ====== Bug #2 part 1: dedup index for issues per pre_publish (per lang) ======

create unique index issues_one_per_pre_publish
  on issues (pre_publish_id, lang)
  where pre_publish_id is not null;

-- ====== Bug #1: row-count assertions on *_commit functions ======

create or replace function compress_commit(
  p_channel channel_kind,
  p_draft_content text,
  p_source_ids bigint[]
) returns bigint
language plpgsql
as $$
declare
  new_id bigint;
  affected int;
begin
  insert into drafts (channel, content, source_item_ids)
  values (p_channel, p_draft_content, p_source_ids)
  returning id into new_id;

  update news_items
  set compressed = true,
      claimed_at = null,
      claim_id = null
  where id = any(p_source_ids);

  get diagnostics affected = row_count;
  if affected <> array_length(p_source_ids, 1) then
    raise exception 'compress_commit: expected % rows updated, got %',
      array_length(p_source_ids, 1), affected;
  end if;

  return new_id;
end;
$$;

create or replace function score_commit(
  p_channel channel_kind,
  p_draft_id bigint,
  p_scored_content text
) returns bigint
language plpgsql
as $$
declare new_id bigint;
begin
  insert into scored_drafts (channel, draft_id, content)
  values (p_channel, p_draft_id, p_scored_content)
  returning id into new_id;

  update drafts
  set scored = true,
      claimed_at = null,
      claim_id = null
  where id = p_draft_id;

  if not found then
    raise exception 'score_commit: draft % not found', p_draft_id;
  end if;

  return new_id;
end;
$$;

create or replace function merge_commit(
  p_channel channel_kind,
  p_title text,
  p_summary text,
  p_content_md text,
  p_tags text[],
  p_cover_image text,
  p_source_scored_ids bigint[]
) returns bigint
language plpgsql
as $$
declare
  new_id bigint;
  affected int;
begin
  insert into pre_publish (
    channel, title, summary, content_md, tags, cover_image, source_scored_ids
  )
  values (
    p_channel, p_title, p_summary, p_content_md, p_tags, p_cover_image, p_source_scored_ids
  )
  returning id into new_id;

  update scored_drafts
  set merged = true,
      claimed_at = null,
      claim_id = null
  where id = any(p_source_scored_ids);

  get diagnostics affected = row_count;
  if affected <> array_length(p_source_scored_ids, 1) then
    raise exception 'merge_commit: expected % rows updated, got %',
      array_length(p_source_scored_ids, 1), affected;
  end if;

  return new_id;
end;
$$;

create or replace function render_commit(
  p_pre_publish_id bigint,
  p_content_html text
) returns void
language plpgsql
as $$
begin
  update pre_publish
  set content_html = p_content_html,
      claimed_at = null,
      claim_id = null
  where id = p_pre_publish_id;

  if not found then
    raise exception 'render_commit: pre_publish % not found', p_pre_publish_id;
  end if;
end;
$$;

create or replace function publish_commit(
  p_pre_publish_id bigint,
  p_lang lang_kind
) returns bigint
language plpgsql
as $$
declare
  new_issue_id bigint;
  pp record;
  affected int;
  expected int;
begin
  -- Bug #2 part 2: lock the pre_publish row at read time to serialize concurrent
  -- publish_commit calls for the same id. Combined with the unique index on
  -- (pre_publish_id, lang), duplicate issues are impossible.
  select * into pp from pre_publish where id = p_pre_publish_id for update;

  insert into issues (
    channel, lang, title, summary, content_html, tags, cover_image,
    pre_publish_id, journal_id
  )
  values (
    pp.channel, p_lang, pp.title, pp.summary, pp.content_html,
    pp.tags, pp.cover_image, pp.id, null
  )
  returning id into new_issue_id;

  update issues set journal_id = new_issue_id where id = new_issue_id;

  update pre_publish
  set published = true,
      published_journal_id = new_issue_id,
      claimed_at = null,
      claim_id = null
  where id = p_pre_publish_id;

  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'publish_commit: expected 1 pre_publish row updated, got %', affected;
  end if;

  if pp.source_scored_ids is not null and array_length(pp.source_scored_ids, 1) > 0 then
    update scored_drafts
    set published = true
    where id = any(pp.source_scored_ids);

    get diagnostics affected = row_count;
    expected := array_length(pp.source_scored_ids, 1);
    if affected <> expected then
      raise exception 'publish_commit: expected % scored_drafts rows updated, got %',
        expected, affected;
    end if;
  end if;

  return new_issue_id;
end;
$$;
