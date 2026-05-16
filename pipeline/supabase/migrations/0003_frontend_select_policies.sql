-- Frontend SELECT policies for the public website.
-- Allows the anon role (browser fetch via supabase-js with publishable key)
-- to read AI-channel issues and the matching tag counts.
--
-- Other channels (snow) and admin-only state stay locked behind service-role
-- access — the policies below intentionally scope to `channel = 'ai'`.
--
-- Pipeline writes continue to flow through the service-role key, which bypasses
-- RLS entirely, so this migration does not affect the write path.

create policy "anon_select_ai_issues"
  on issues for select
  to anon
  using (channel = 'ai');

create policy "anon_select_ai_tag_counts"
  on tag_counts for select
  to anon
  using (channel = 'ai');
