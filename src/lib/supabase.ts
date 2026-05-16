import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库表类型定义
export interface N8nAiContent {
  id: string
  title: string
  content: string
  summary: string
  tags: string | null
  created_at: string
  lang?: string
  is_published?: boolean
  imgUrl: string | null
  journal_id?: string
}

// SnapAI 博客类型定义
export interface SnapAiInsight {
  id: string
  title: string
  slug: string
  content_md: string
  excerpt: string | null
  cover_image: string | null
  author: string
  related_journal_id: string | null
  tags: string[] | null
  lang: string
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}
