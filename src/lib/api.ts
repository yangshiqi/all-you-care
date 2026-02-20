// src/lib/api.ts
import { supabase, N8nAiContent, SnapAiInsight } from './supabase'
import { cache } from 'react'

// -----------------------------------------------------------------------------
// Existing API: AI Contents (Issues)
// -----------------------------------------------------------------------------

export interface IssueSummary {
  id: string
  title: string
  summary: string
  date: string
  tags: string[]
  journal_id: string
}

export interface TagSummary {
  name: string
  total: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ... (Existing content functions remain unchanged) ...

export const getAllAiContentsPaginated = cache(async (
  page: number = 1,
  pageSize: number = 10,
  i18nLang?: string
): Promise<PaginatedResult<IssueSummary>> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let countQuery = supabase
      .from('n8n-ai-contents')
      .select('*', { count: 'exact', head: true })
    if (dbLang) countQuery = countQuery.eq('lang', dbLang)
    
    const { count, error: countError } = await countQuery
    if (countError) throw new Error(`Failed to count AI contents: ${countError.message}`)

    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)

    let dataQuery = supabase
      .from('n8n-ai-contents')
      .select('id, title, summary, created_at, tags, lang, journal_id')
      .order('created_at', { ascending: false })
      .range(from, to)
    if (dbLang) dataQuery = dataQuery.eq('lang', dbLang)

    const { data, error } = await dataQuery
    if (error) throw new Error(`Failed to fetch AI contents: ${error.message}`)

    const formattedData: IssueSummary[] = (data || []).map(item => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      date: formatDate(item.created_at),
      tags: extractTagsFromContent(item.tags),
      journal_id: item.journal_id
    }))

    return { data: formattedData, total, page, pageSize, totalPages }
  } catch (error) {
    console.error('Error in getAllAiContentsPaginated:', error)
    throw error
  }
})

export const getAllAiContentIds = cache(async (i18nLang?: string): Promise<{ id: string; journal_id?: string; created_at: string }[]> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)
    let query = supabase.from('n8n-ai-contents').select('id, journal_id, created_at').order('created_at', { ascending: false })
    if (dbLang) query = query.eq('lang', dbLang)
    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch AI content IDs: ${error.message}`)
    return data || []
  } catch (error) {
    console.error('Error in getAllAiContentIds:', error)
    throw error
  }
})

export const getAllAiContents = cache(async (i18nLang?: string): Promise<N8nAiContent[]> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)
    let query = supabase.from('n8n-ai-contents').select('*').order('created_at', { ascending: false })
    if (dbLang) query = query.eq('lang', dbLang)
    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch AI contents: ${error.message}`)
    return data || []
  } catch (error) {
    console.error('Error in getAllAiContents:', error)
    throw error
  }
})

export const getAiContentByJournalId = cache(async (journalId: string, i18nLang?: string): Promise<N8nAiContent | null> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)
    if (dbLang) {
      const { data, error } = await supabase
        .from('n8n-ai-contents')
        .select('*')
        .eq('journal_id', journalId)
        .eq('lang', dbLang)
        .single()
      if (!error && data) return data
      return null
    }
    const { data, error } = await supabase.from('n8n-ai-contents').select('*').eq('journal_id', journalId).single()
    if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch AI content: ${error.message}`)
    return data || null
  } catch (error) {
    console.error('Error in getAiContentByJournalId:', error)
    throw error
  }
})

export const getIssueSummaries = cache(async (limit: number = 5, i18nLang?: string): Promise<IssueSummary[]> => {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoISO = sevenDaysAgo.toISOString()
    const dbLang = mapI18nLangToDbLang(i18nLang)

    let query = supabase
      .from('n8n-ai-contents')
      .select('id, title, summary, created_at, tags, lang, journal_id')
      .gte('created_at', sevenDaysAgoISO)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (dbLang) query = query.eq('lang', dbLang)

    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch issue summaries: ${error.message}`)

    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      date: formatDate(item.created_at),
      tags: extractTagsFromContent(item.tags),
      journal_id: item.journal_id
    }))
  } catch (error) {
    console.error('Error in getIssueSummaries:', error)
    throw error
  }
})

// -----------------------------------------------------------------------------
// NEW API: SnapAI Insights (Blog)
// -----------------------------------------------------------------------------

/**
 * Get published insights list
 */
export const getPublishedInsights = cache(async (i18nLang?: string, author?: string): Promise<SnapAiInsight[]> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)
    let query = supabase
      .from('snapai_insights')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
    
    if (dbLang) query = query.eq('lang', dbLang)
    
    // Add author filter if provided
    if (author) {
      // Use ilike for case-insensitive matching because author names might vary slightly
      // e.g. "Zack" vs "Zack @ SnapAllx"
      query = query.ilike('author', `${author}%`)
    }

    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch insights: ${error.message}`)
    return data || []
  } catch (error) {
    console.error('Error in getPublishedInsights:', error)
    return []
  }
})

/**
 * Get insight by slug
 */
export const getInsightBySlug = cache(async (slug: string, i18nLang?: string): Promise<SnapAiInsight | null> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)
    
    // First try to find exact match with language
    let query = supabase
      .from('snapai_insights')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      
    if (dbLang) {
      query = query.eq('lang', dbLang)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found with current language. 
        // If we are looking for EN but only ZH exists (or vice versa), maybe fallback?
        // For now, return null (404) is correct behavior if translation doesn't exist.
        return null
      }
      throw new Error(`Failed to fetch insight: ${error.message}`)
    }
    return data || null
  } catch (error) {
    console.error('Error in getInsightBySlug:', error)
    return null
  }
})

/**
 * Get insight related to a journal/issue
 */
export const getInsightByJournalId = cache(async (journalId: string): Promise<SnapAiInsight | null> => {
  try {
    const { data, error } = await supabase
      .from('snapai_insights')
      .select('*')
      .eq('related_journal_id', journalId)
      .eq('is_published', true)
      .limit(1)
      .single() // Return first match if any

    if (error && error.code !== 'PGRST116') {
      console.warn(`Failed to fetch insight for journal ${journalId}: ${error.message}`)
      return null
    }
    return data || null
  } catch (error) {
    console.error('Error in getInsightByJournalId:', error)
    return null
  }
})

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function mapI18nLangToDbLang(i18nLang: string | undefined): string | undefined {
  if (!i18nLang) return undefined
  if (i18nLang === 'zh-CN' || i18nLang === 'zh') return 'zh_CN'
  if (i18nLang.startsWith('en')) return 'en'
  return undefined
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function extractTagsFromContent(tags: string | null | undefined): string[] {
  if (!tags) return ['ai', 'technology']
  if (Array.isArray(tags)) {
    return tags.filter(tag => tag && typeof tag === 'string' && tag.trim() !== '').map(tag => tag.trim()).slice(0, 10)
  }
  if (typeof tags === 'string') {
    try {
      if (tags.trim().startsWith('[') && tags.trim().endsWith(']')) {
        const parsed = JSON.parse(tags)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(tag => tag && typeof tag === 'string' && tag.trim() !== '').map(tag => tag.trim()).slice(0, 10)
        }
      }
    } catch (error) {
      console.warn('Failed to parse tags as JSON:', error)
    }
  }
  return ['ai', 'technology']
}

export const getAllTags = cache(async (i18nLang?: string): Promise<TagSummary[]> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)
    let query = supabase.from('n8n-ai-contents').select('tags')
    if (dbLang) query = query.eq('lang', dbLang)
    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch tags: ${error.message}`)
    const tagCountMap = new Map<string, number>()
    if (data) {
      data.forEach((item) => {
        const tags = extractTagsFromContent(item.tags)
        tags.forEach((tag) => {
          const normalizedTag = tag.trim().toLowerCase()
          if (normalizedTag) tagCountMap.set(normalizedTag, (tagCountMap.get(normalizedTag) || 0) + 1)
        })
      })
    }
    return Array.from(tagCountMap.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total)
  } catch (error) {
    console.error('Error in getAllTags:', error)
    throw error
  }
})
