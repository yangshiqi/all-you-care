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
