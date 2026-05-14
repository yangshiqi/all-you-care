-- pgcrypto: provides gen_random_uuid() used by claim RPC functions
create extension if not exists pgcrypto;

-- RLS: deny all anon/authenticated access to pipeline tables.
-- Pipeline writes go through service-role key which bypasses RLS.
-- Frontend SELECT policies (when issues table is exposed) come in a later migration.
alter table news_items     enable row level security;
alter table drafts         enable row level security;
alter table scored_drafts  enable row level security;
alter table pre_publish    enable row level security;
alter table issues         enable row level security;
alter table cover_images   enable row level security;
alter table tag_counts     enable row level security;
