// src/lib/api.ts
import { supabase, N8nAiContent, SnapAiInsight, IssueRow } from './supabase'
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

// -----------------------------------------------------------------------------
// Internal helpers — map pipeline `issues` rows to the stable N8nAiContent shape.
// -----------------------------------------------------------------------------

const ISSUE_COLS_LIGHT = 'id, title, summary, published_at, tags, lang, journal_id, cover_image'
const ISSUE_COLS_FULL = 'id, title, summary, content_html, published_at, created_at, tags, lang, journal_id, cover_image, delivered'

type IssueLightRow = Pick<IssueRow, 'id' | 'title' | 'summary' | 'published_at' | 'tags' | 'lang' | 'journal_id' | 'cover_image'>
type IssueFullRow = Pick<IssueRow, 'id' | 'title' | 'summary' | 'content_html' | 'published_at' | 'created_at' | 'tags' | 'lang' | 'journal_id' | 'cover_image' | 'delivered'>

function mapIssueRow(row: IssueFullRow): N8nAiContent {
  return {
    id: row.id != null ? String(row.id) : '',
    title: row.title ?? '',
    content: row.content_html ?? '',
    summary: row.summary ?? '',
    tags: row.tags ?? null,
    created_at: row.published_at ?? row.created_at ?? '',
    lang: row.lang,
    is_published: row.delivered,
    imgUrl: row.cover_image ?? null,
    journal_id: row.journal_id != null ? String(row.journal_id) : undefined,
  }
}

function mapIssueRowToSummary(row: IssueLightRow): IssueSummary {
  return {
    id: row.id != null ? String(row.id) : '',
    title: row.title ?? '',
    summary: row.summary ?? '',
    date: formatDate(row.published_at ?? ''),
    tags: extractTagsFromContent(row.tags),
    journal_id: row.journal_id != null ? String(row.journal_id) : ''
  }
}

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
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('channel', 'ai')
    if (dbLang) countQuery = countQuery.eq('lang', dbLang)

    const { count, error: countError } = await countQuery
    if (countError) throw new Error(`Failed to count AI contents: ${countError.message}`)

    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)

    let dataQuery = supabase
      .from('issues')
      .select(ISSUE_COLS_LIGHT)
      .eq('channel', 'ai')
      .order('published_at', { ascending: false })
      .range(from, to)
    if (dbLang) dataQuery = dataQuery.eq('lang', dbLang)

    const { data, error } = await dataQuery
    if (error) throw new Error(`Failed to fetch AI contents: ${error.message}`)

    const rows = (data ?? []) as IssueLightRow[]
    const formattedData: IssueSummary[] = rows.map(mapIssueRowToSummary)

    return { data: formattedData, total, page, pageSize, totalPages }
  } catch (error) {
    console.error('Error in getAllAiContentsPaginated:', error)
    throw error
  }
})

export const getAllAiContentIds = cache(async (i18nLang?: string): Promise<{ id: string; journal_id?: string; created_at: string }[]> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)
    let query = supabase
      .from('issues')
      .select('id, journal_id, published_at')
      .eq('channel', 'ai')
      .order('published_at', { ascending: false })
    if (dbLang) query = query.eq('lang', dbLang)
    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch AI content IDs: ${error.message}`)
    const rows = (data ?? []) as Pick<IssueRow, 'id' | 'journal_id' | 'published_at'>[]
    return rows.map(r => ({
      id: String(r.id),
      journal_id: r.journal_id != null ? String(r.journal_id) : undefined,
      created_at: r.published_at,
    }))
  } catch (error) {
    console.error('Error in getAllAiContentIds:', error)
    throw error
  }
})

export const getAllAiContents = cache(async (i18nLang?: string): Promise<N8nAiContent[]> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)
    let query = supabase
      .from('issues')
      .select(ISSUE_COLS_FULL)
      .eq('channel', 'ai')
      .order('published_at', { ascending: false })
    if (dbLang) query = query.eq('lang', dbLang)
    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch AI contents: ${error.message}`)
    const rows = (data ?? []) as IssueFullRow[]
    return rows.map(mapIssueRow)
  } catch (error) {
    console.error('Error in getAllAiContents:', error)
    throw error
  }
})

export const getAiContentByJournalId = cache(async (journalId: string, i18nLang?: string): Promise<N8nAiContent | null> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)
    const numericId = Number(journalId)
    if (!Number.isFinite(numericId)) return null

    let query = supabase
      .from('issues')
      .select(ISSUE_COLS_FULL)
      .eq('channel', 'ai')
      .eq('journal_id', numericId)
    if (dbLang) query = query.eq('lang', dbLang)

    const { data, error } = await query.maybeSingle()
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch AI content: ${error.message}`)
    }
    return data ? mapIssueRow(data as IssueFullRow) : null
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
      .from('issues')
      .select(ISSUE_COLS_LIGHT)
      .eq('channel', 'ai')
      .gte('published_at', sevenDaysAgoISO)
      .order('published_at', { ascending: false })
      .limit(limit)
    if (dbLang) query = query.eq('lang', dbLang)

    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch issue summaries: ${error.message}`)

    const rows = (data ?? []) as IssueLightRow[]
    return rows.map(mapIssueRowToSummary)
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
      .order('created_at', { ascending: false })
    
    if (dbLang) query = query.eq('lang', dbLang)
    
    // Add author filter if provided
    if (author) {
      // Use ilike for case-insensitive matching because author names might vary slightly
      // e.g. "Zack" vs "Zack @ SnapAllx"
      // Also map simplified IDs to full names if needed
      // But author avatars use 'zack', 'tom' etc.
      // In DB, author might be 'Zack', 'Tom', 'Brad', 'Tim', or 'Zack @ SnapAllx'
      // If we query ?author=Zack, we want to match 'Zack' and 'Zack @ SnapAllx'
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

export const getInsightByJournalId = cache(async (journalId: string, i18nLang?: string): Promise<SnapAiInsight | null> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)
    
    let query = supabase
      .from('snapai_insights')
      .select('*')
      .eq('related_journal_id', journalId)
      .eq('is_published', true)
      
    if (dbLang) {
      query = query.eq('lang', dbLang)
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(1)

    if (error) {
      console.warn(`Failed to fetch insight for journal ${journalId}: ${error.message}`)
      return null
    }
    return (data && data.length > 0) ? data[0] : null
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

export function extractTagsFromContent(tags: string | string[] | null | undefined): string[] {
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

/**
 * Get all distinct months (YYYY-MM) that have issues.
 * Used for sitemap splitting.
 */
export const getIssueMonths = cache(async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('issues')
      .select('published_at')
      .eq('channel', 'ai')
      .order('published_at', { ascending: false });

    if (error) throw error;

    const months = new Set<string>();
    const rows = (data ?? []) as Pick<IssueRow, 'published_at'>[]
    rows.forEach(item => {
      if (item.published_at) {
        const date = new Date(item.published_at);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        months.add(`${year}-${month}`);
      }
    });

    return Array.from(months);
  } catch (error) {
    console.error('Error in getIssueMonths:', error);
    return [];
  }
});

/**
 * Get issues for a specific month (YYYY-MM).
 * Lightweight query returning only ID and Date.
 */
export const getIssuesByMonth = cache(async (monthStr: string, i18nLang?: string): Promise<{ id: string; journal_id?: string; created_at: string }[]> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)

    const [year, month] = monthStr.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const endDate = new Date(Date.UTC(year, month, 1)).toISOString();

    let query = supabase
      .from('issues')
      .select('id, journal_id, published_at')
      .eq('channel', 'ai')
      .gte('published_at', startDate)
      .lt('published_at', endDate)
      .order('published_at', { ascending: false });

    if (dbLang) query = query.eq('lang', dbLang)

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as Pick<IssueRow, 'id' | 'journal_id' | 'published_at'>[]
    return rows.map(r => ({
      id: String(r.id),
      journal_id: r.journal_id != null ? String(r.journal_id) : undefined,
      created_at: r.published_at,
    }))
  } catch (error) {
    console.error(`Error fetching issues for month ${monthStr}:`, error);
    return [];
  }
});
