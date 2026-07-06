-- Frontend SELECT policy for the infra channel (AI 原生周报).
--
-- The public website reads `issues` through the anon role (supabase-js with the
-- publishable/anon key). Migration 0003 scoped anon SELECT to `channel = 'ai'`
-- only, so infra-channel issues are invisible to the browser and the new
-- /[lang]/infra pages would render empty. This adds a matching policy for
-- `channel = 'infra'`.
--
-- Pipeline writes continue to flow through the service-role key, which bypasses
-- RLS entirely, so this migration does not affect the write path. Other channels
-- (snow) remain locked to service-role access.

create policy "anon_select_infra_issues"
  on issues for select
  to anon
  using (channel = 'infra');
