import { supabase, N8nAiContent } from './supabase'

// 用于首页显示的简化版本
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

/**
 * 分页结果接口
 */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 从 Supabase 获取所有 AI 内容（支持分页）
 */
export async function getAllAiContentsPaginated(
  page: number = 1,
  pageSize: number = 10,
  i18nLang?: string
): Promise<PaginatedResult<IssueSummary>> {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)

    // 计算偏移量
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // 构建查询 - 先获取总数
    let countQuery = supabase
      .from('n8n-ai-contents')
      .select('*', { count: 'exact', head: true })

    if (dbLang) {
      countQuery = countQuery.eq('lang', dbLang)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting AI contents:', countError)
      throw new Error(`Failed to count AI contents: ${countError.message}`)
    }

    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)

    // 获取分页数据
    let dataQuery = supabase
      .from('n8n-ai-contents')
      .select('id, title, summary, created_at, tags, lang, journal_id')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (dbLang) {
      dataQuery = dataQuery.eq('lang', dbLang)
    }

    const { data, error } = await dataQuery

    if (error) {
      console.error('Error fetching AI contents:', error)
      throw new Error(`Failed to fetch AI contents: ${error.message}`)
    }

    // 转换为 IssueSummary 格式
    const formattedData: IssueSummary[] = (data || []).map(item => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      date: formatDate(item.created_at),
      tags: extractTagsFromContent(item.tags),
      journal_id: item.journal_id
    }))

    return {
      data: formattedData,
      total,
      page,
      pageSize,
      totalPages
    }
  } catch (error) {
    console.error('Error in getAllAiContentsPaginated:', error)
    throw error
  }
}

/**
 * 从 Supabase 获取所有 AI 内容
 */
export async function getAllAiContents(i18nLang?: string): Promise<N8nAiContent[]> {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)

    let query = supabase
      .from('n8n-ai-contents')
      .select('*')
      .order('created_at', { ascending: false })

    if (dbLang) {
      // 根据当前站点语言过滤对应语言版本
      query = query.eq('lang', dbLang)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching AI contents:', error)
      throw new Error(`Failed to fetch AI contents: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllAiContents:', error)
    throw error
  }
}

/**
 * 根据 journal_id 获取单个 AI 内容
 */
export async function getAiContentByJournalId(journalId: string, i18nLang?: string): Promise<N8nAiContent | null> {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)

    // 优先按语言查找
    if (dbLang) {
      const { data: langData, error: langError } = await supabase
        .from('n8n-ai-contents')
        .select('*')
        .eq('journal_id', journalId)
        .eq('lang', dbLang)
        .single()

      if (!langError && langData) {
        return langData
      }

      // 在没有对应的语言版本时，返回 null
      return null  
    }
    
    // 如果语言版本不存在，继续走非语言限定的回退逻辑
    const { data, error } = await supabase
      .from('n8n-ai-contents')
      .select('*')
      .eq('journal_id', journalId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 记录不存在
        return null
      }
      console.error('Error fetching AI content by journal ID:', error)
      throw new Error(`Failed to fetch AI content: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error in getAiContentByJournalId:', error)
    throw error
  }
}

/**
 * 获取用于首页显示的期刊摘要列表（最近7天）
 */
// 将 i18n 语言映射到数据库中的 lang 值
function mapI18nLangToDbLang(i18nLang: string | undefined): string | undefined {
  if (!i18nLang) return undefined
  if (i18nLang === 'zh-CN' || i18nLang === 'zh') return 'zh_CN'
  if (i18nLang.startsWith('en')) return 'en'
  return undefined
}

export async function getIssueSummaries(limit: number = 5, i18nLang?: string): Promise<IssueSummary[]> {
  try {
    // 计算7天前的日期
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

    if (dbLang) {
      // 根据当前站点语言过滤对应语言版本
      query = query.eq('lang', dbLang)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching issue summaries:', error)
      throw new Error(`Failed to fetch issue summaries: ${error.message}`)
    }

    // 转换为 IssueSummary 格式
    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      date: formatDate(item.created_at),
      tags: extractTagsFromContent(item.tags), // 从 tags 字段解析标签
      journal_id: item.journal_id
    }))
  } catch (error) {
    console.error('Error in getIssueSummaries:', error)
    throw error
  }
}

/**
 * 格式化日期为可读格式
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * 从 Supabase tags 字段解析标签数组
 */
export function extractTagsFromContent(tags: string | null | undefined): string[] {
  // 处理 null 或 undefined 的情况
  if (!tags) {
    return ['ai', 'technology']; // 返回默认标签
  }

  // 如果 tags 已经是数组，直接返回
  if (Array.isArray(tags)) {
    return tags
      .filter(tag => tag && typeof tag === 'string' && tag.trim() !== '')
      .map(tag => tag.trim())
      .slice(0, 10); // 最多返回10个标签
  }

  // 如果 tags 是字符串，尝试解析为JSON数组
  if (typeof tags === 'string') {
    try {
      // 检查是否是JSON数组格式
      if (tags.trim().startsWith('[') && tags.trim().endsWith(']')) {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 过滤掉空值和无效标签，并限制数量
          const validTags = parsed
            .filter(tag => tag && typeof tag === 'string' && tag.trim() !== '')
            .map(tag => tag.trim())
            .slice(0, 10); // 最多返回10个标签
          
          if (validTags.length > 0) {
            return validTags;
          }
        }
      }
    } catch (error) {
      // 如果JSON解析失败，返回默认标签
      console.warn('Failed to parse tags as JSON:', error);
    }
  }

  // 如果无法解析，返回默认标签
  return ['ai', 'technology'];
}

/**
 * 从 n8n_ai_contents 表获取所有标签及数量（支持语言过滤）
 */
export async function getAllTags(i18nLang?: string): Promise<TagSummary[]> {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)

    // 从 n8n-ai-contents 表中获取所有内容，根据语言过滤
    let query = supabase
      .from('n8n-ai-contents')
      .select('tags')

    if (dbLang) {
      // 根据当前站点语言过滤对应语言版本
      query = query.eq('lang', dbLang)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching tags:', error)
      throw new Error(`Failed to fetch tags: ${error.message}`)
    }

    // 统计标签数量
    const tagCountMap = new Map<string, number>()

    if (data) {
      data.forEach((item) => {
        const tags = extractTagsFromContent(item.tags)
        tags.forEach((tag) => {
          const normalizedTag = tag.trim().toLowerCase()
          if (normalizedTag) {
            tagCountMap.set(normalizedTag, (tagCountMap.get(normalizedTag) || 0) + 1)
          }
        })
      })
    }

    // 转换为 TagSummary 数组并按数量排序
    const tagSummaries: TagSummary[] = Array.from(tagCountMap.entries())
      .map(([name, total]) => ({
        name,
        total,
      }))
      .sort((a, b) => b.total - a.total)

    return tagSummaries
  } catch (error) {
    console.error('Error in getAllTags:', error)
    throw error
  }
}
