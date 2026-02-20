-- SQL for creating snapai_insights table

create table if not exists snapai_insights (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  content_md text not null,
  excerpt text, -- 摘要/导语，用于列表展示
  cover_image text, -- 封面图 URL（可选）
  author text default 'SnapAI',
  related_journal_id text, -- 关联的快讯 ID
  tags text[] default '{}',
  lang text default 'zh_CN', -- 语言支持
  is_published boolean default false,
  published_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for performance
create index if not exists snapai_insights_slug_idx on snapai_insights (slug);
create index if not exists snapai_insights_lang_idx on snapai_insights (lang);
create index if not exists snapai_insights_published_at_idx on snapai_insights (published_at);
create index if not exists snapai_insights_tags_gin_idx on snapai_insights using gin (tags);

-- Enable RLS (Row Level Security)
alter table snapai_insights enable row level security;

-- Policy: Public can read published insights
create policy "Public can view published insights"
  on snapai_insights
  for select
  using (is_published = true);

-- Policy: Authenticated users (service role) can do anything
create policy "Service role can manage all insights"
  on snapai_insights
  for all
  using (auth.role() = 'service_role');

-- Comment
comment on table snapai_insights is 'SnapAI generated deep insights and blog posts.';
