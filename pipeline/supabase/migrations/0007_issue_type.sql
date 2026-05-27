create type issue_type_kind as enum ('daily', 'weekly');

alter table issues
  add column issue_type issue_type_kind not null default 'daily';

alter table pre_publish
  add column issue_type issue_type_kind not null default 'daily';

create index issues_type_published
  on issues (issue_type, published_at desc);

-- Update publish_commit to propagate issue_type from pre_publish to issues.
create or replace function publish_commit(
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
    pre_publish_id, journal_id, issue_type
  )
  values (
    pp.channel, p_lang, pp.title, pp.summary, pp.content_html,
    pp.tags, pp.cover_image, pp.id, null, pp.issue_type
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
