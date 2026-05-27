import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// NOTE: DB backend has moved to the `issues` table (channel='ai'). This interface
// remains the stable frontend contract — src/lib/api.ts maps issue rows to this shape.
export interface N8nAiContent {
  id: string
  title: string
  content: string
  summary: string
  tags: string | string[] | null
  created_at: string
  lang?: string
  is_published?: boolean
  imgUrl: string | null
  journal_id?: string
}

// Internal: shape of a row in the pipeline `issues` table. Only used inside src/lib/api.ts.
export interface IssueRow {
  id: number
  channel: 'ai' | 'snow'
  lang: 'zh_CN' | 'en'
  title: string
  summary: string | null
  content_html: string
  tags: string[]
  cover_image: string | null
  journal_id: number | null
  issue_type: 'daily' | 'weekly'
  published_at: string
  created_at: string
  delivered: boolean
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
