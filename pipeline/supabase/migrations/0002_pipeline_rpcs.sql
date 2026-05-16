-- ====== claim_for_* (申领 N 行待处理 row, FOR UPDATE SKIP LOCKED) ======

create function claim_for_compress(p_channel channel_kind, p_limit int)
returns setof news_items
language sql
as $$
  with picked as (
    select id from news_items
    where channel = p_channel
      and compressed = false
      and attempt_count < 5
      and (claimed_at is null or claimed_at < now() - interval '30 minutes')
    order by fetched_at asc
    limit p_limit
    for update skip locked
  )
  update news_items n
  set claimed_at = now(),
      claim_id = gen_random_uuid()
  from picked p
  where n.id = p.id
  returning n.*;
$$;

create function claim_for_score(p_channel channel_kind, p_limit int)
returns setof drafts
language sql
as $$
  with picked as (
    select id from drafts
    where channel = p_channel
      and scored = false
      and attempt_count < 5
      and (claimed_at is null or claimed_at < now() - interval '30 minutes')
    order by created_at asc
    limit p_limit
    for update skip locked
  )
  update drafts d
  set claimed_at = now(),
      claim_id = gen_random_uuid()
  from picked p
  where d.id = p.id
  returning d.*;
$$;

create function claim_for_merge(p_channel channel_kind, p_limit int)
returns setof scored_drafts
language sql
as $$
  with picked as (
    select id from scored_drafts
    where channel = p_channel
      and merged = false
      and attempt_count < 5
      and (claimed_at is null or claimed_at < now() - interval '30 minutes')
    order by created_at asc
    limit p_limit
    for update skip locked
  )
  update scored_drafts s
  set claimed_at = now(),
      claim_id = gen_random_uuid()
  from picked p
  where s.id = p.id
  returning s.*;
$$;

create function claim_for_render(p_channel channel_kind, p_limit int)
returns setof pre_publish
language sql
as $$
  with picked as (
    select id from pre_publish
    where channel = p_channel
      and content_html is null
      and attempt_count < 5
      and (claimed_at is null or claimed_at < now() - interval '30 minutes')
    order by created_at asc
    limit p_limit
    for update skip locked
  )
  update pre_publish pp
  set claimed_at = now(),
      claim_id = gen_random_uuid()
  from picked p
  where pp.id = p.id
  returning pp.*;
$$;

create function claim_for_publish(p_channel channel_kind, p_limit int)
returns setof pre_publish
language sql
as $$
  with picked as (
    select id from pre_publish
    where channel = p_channel
      and content_html is not null
      and published = false
      and attempt_count < 5
      and (claimed_at is null or claimed_at < now() - interval '30 minutes')
    order by created_at asc
    limit p_limit
    for update skip locked
  )
  update pre_publish pp
  set claimed_at = now(),
      claim_id = gen_random_uuid()
  from picked p
  where pp.id = p.id
  returning pp.*;
$$;

-- ====== *_commit (insert 下游 + 标 flag + 清 claim, 原子) ======

create function compress_commit(
  p_channel channel_kind,
  p_draft_content text,
  p_source_ids bigint[]
) returns bigint
language plpgsql
as $$
declare new_id bigint;
begin
  insert into drafts (channel, content, source_item_ids)
  values (p_channel, p_draft_content, p_source_ids)
  returning id into new_id;

  update news_items
  set compressed = true,
      claimed_at = null,
      claim_id = null
  where id = any(p_source_ids);

  return new_id;
end;
$$;

create function score_commit(
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

  return new_id;
end;
$$;

create function merge_commit(
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
declare new_id bigint;
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

  return new_id;
end;
$$;

create function render_commit(
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
end;
$$;

create function publish_commit(
  p_pre_publish_id bigint,
  p_lang lang_kind
) returns bigint
language plpgsql
as $$
declare
  new_issue_id bigint;
  pp record;
begin
  select * into pp from pre_publish where id = p_pre_publish_id;

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

  update scored_drafts
  set published = true
  where id = any(pp.source_scored_ids);

  return new_issue_id;
end;
$$;

-- ====== mark_failed (失败时 attempt_count++ + 写 error + 释放 claim) ======

create function mark_failed_news_item(p_id bigint, p_err text)
returns void language sql as $$
  update news_items
  set attempt_count = attempt_count + 1,
      last_error = p_err,
      claimed_at = null, claim_id = null
  where id = p_id;
$$;

create function mark_failed_draft(p_id bigint, p_err text)
returns void language sql as $$
  update drafts
  set attempt_count = attempt_count + 1,
      last_error = p_err,
      claimed_at = null, claim_id = null
  where id = p_id;
$$;

create function mark_failed_scored_draft(p_id bigint, p_err text)
returns void language sql as $$
  update scored_drafts
  set attempt_count = attempt_count + 1,
      last_error = p_err,
      claimed_at = null, claim_id = null
  where id = p_id;
$$;

create function mark_failed_pre_publish(p_id bigint, p_err text)
returns void language sql as $$
  update pre_publish
  set attempt_count = attempt_count + 1,
      last_error = p_err,
      claimed_at = null, claim_id = null
  where id = p_id;
$$;
