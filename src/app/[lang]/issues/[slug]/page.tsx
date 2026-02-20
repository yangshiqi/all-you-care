// src/app/[lang]/issues/[slug]/page.tsx
import { Metadata } from 'next'
import { getAiContentByJournalId, getAllAiContentIds, getInsightByJournalId } from '@/lib/api'
import { IssueDetailContent } from '@/components/IssueDetailContent'
import { notFound } from 'next/navigation'

interface Props {
  params: {
    slug: string
    lang: string
  }
}

// 缓存 issue 存在性验证结果
// 在 generateStaticParams 中验证，避免在 Page 组件中重复验证失败
export async function generateStaticParams({ params }: Props) {
  const { lang } = await params
  
  // 直接获取当前语言的所有内容 ID (轻量级查询)
  const contents = await getAllAiContentIds(lang)
  
  // 提取有效的 slug (优先使用 journal_id，回退到 id)
  const slugs = contents
    .map(item => item.journal_id || item.id)
    .filter(Boolean)
    
  // 去重
  const uniqueSlugs = Array.from(new Set(slugs))
  
  return uniqueSlugs.map((slug) => ({
    slug: String(slug),
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lang } = await params
  const issue = await getAiContentByJournalId(slug, lang)

  if (!issue) {
    return {
      title: 'Not Found',
      description: 'The issue you are looking for does not exist.',
    }
  }

  // 格式化日期
  const date = new Date(issue.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  // 提取第一张图片的 URL 用于 Open Graph
  const imgUrl = issue.imgUrl || '/x_welcome.jpg';

  // 构建完整的图片 URL（如果是相对路径）
  const ogImageUrl = imgUrl.startsWith('http') 
    ? imgUrl 
    : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snapallx.com'}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;

  return {
    title: issue.title,
    description: issue.summary,
    openGraph: {
      title: issue.title,
      description: issue.summary,
      type: 'article',
      publishedTime: issue.created_at,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: issue.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: issue.title,
      description: issue.summary,
      images: [ogImageUrl],
    },
  }
}

function removeTagsSection(content: string): string {
  if (!content) return '';
  
  // 1. 移除包含 class="tags" 的容器
  // 优化：一次性移除所有匹配项，避免循环
  let cleanContent = content;
  
  // 移除特定标题
  cleanContent = cleanContent.replace(/<h[12][^>]*>\s*(AI新闻简报|AI News Brief|AI News Roundup|AI新闻分类汇总|AI News Categories|AI News Summary)\s*<\/h[12]>/gi, '');
  
  // 移除 <div class="tags">...</div> 和 <section class="tags">...</section>
  // 使用非贪婪匹配，处理常见的嵌套情况（简单层级）
  // 注意：正则处理 HTML 有局限性，但在服务端处理这种结构化的抓取内容通常足够
  cleanContent = cleanContent.replace(/<(div|section)[^>]*class=["'](?:\w+\s+)*tags(?:\s+\w+)*["'][^>]*>[\s\S]*?<\/\1>/gi, '');
  
  // 移除 id="tags" 或 id="tag" 的元素
  cleanContent = cleanContent.replace(/<[^>]+id=["']tags?["'][^>]*>[\s\S]*?<\/[^>]+>/gi, '');
  
  // 移除 class="tag" 的单个标签元素
  cleanContent = cleanContent.replace(/<[^>]+class=["'](?:\w+\s+)*tag(?:\s+\w+)*["'][^>]*>[\s\S]*?<\/[^>]+>/gi, '');
  
  // 移除包含"相关标签"或"Related Tags"文本的 section
  cleanContent = cleanContent.replace(/<section[^>]*>[\s\S]*?<h[2-6][^>]*>\s*(相关标签|Related Tags)\s*<\/h[2-6]>[\s\S]*?<\/section>/gi, '');
  
  return cleanContent;
}

// 辅助函数：从 HTML 中提取 body 内容
function extractBodyContent(html: string): string {
  if (!html) return '';
  
  // 尝试匹配 body 标签内的内容
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    return bodyMatch[1].trim();
  }
  
  // 如果没有 body 标签，返回原始内容（可能已经是片段）
  return html;
}

// 辅助函数：解析 HTML 内容
function formatHtmlContent(htmlContent: string) {
  if (!htmlContent) return [];
  
  // 1. 提取 body 内容
  let content = extractBodyContent(htmlContent);
  
  // 2. 移除 tags 区域
  content = removeTagsSection(content);
  
  // 3. 按 h2 分割 section
  // 使用正则匹配 <h2> 标签作为分隔符
  const sections = [];
  
  // 创建一个临时容器来解析 HTML（仅在客户端有效，服务端使用正则）
  // 由于这是服务端组件，我们必须使用正则处理
  
  // 分割 h2
  // 匹配模式：<h2>标题</h2>内容...
  // 我们需要捕获标题和后续内容
  const h2Regex = /<h2[^>]*>(.*?)<\/h2>([\s\S]*?)(?=<h2|$)/gi;
  let match;
  let index = 0;
  
  // 检查开头是否有内容（在第一个 h2 之前）
  const firstH2Index = content.search(/<h2/i);
  if (firstH2Index > 0) {
    // 移除 Introduction 部分，直接跳过
    // const introContent = content.substring(0, firstH2Index).trim();
    // if (introContent) {
    //   sections.push({
    //     id: `section-intro`,
    //     title: 'Introduction',
    //     content: introContent
    //   });
    // }
  } else if (firstH2Index === -1 && content.trim()) {
    // 如果没有 h2，整个内容作为一个 section
    sections.push({
      id: `section-main`,
      title: 'Main Content',
      content: content
    });
    return sections;
  }
  
  while ((match = h2Regex.exec(content)) !== null) {
    const title = match[1].replace(/<[^>]+>/g, '').trim(); // 移除标题中的 HTML 标签
    let sectionContent = match[2].trim();
    
    sections.push({
      id: `section-${index}`,
      title: title || `Section ${index + 1}`,
      content: sectionContent
    });
    index++;
  }
  
  return sections;
}

// 辅助函数：从摘要中提取标签
function extractTagsFromSummary(summary: string): string[] {
  if (!summary) return [];
  // 简单的关键词提取逻辑，实际项目中可以使用更复杂的 NLP 或预定义标签列表
  const keywords = ['AI', 'GPT', 'LLM', 'OpenAI', 'Google', 'Microsoft', 'Apple', 'Meta', 'NVIDIA', 'Robot', 'Agent', 'RAG', 'Sora', 'Gemini', 'Claude', 'Llama'];
  return keywords.filter(keyword => summary.includes(keyword));
}

export default async function IssueDetailPage({ params }: Props) {
  const { slug, lang } = await params

  // 并行获取 issue 数据和关联的 insight
  // 即使其中一个失败，也可以通过 Promise.allSettled 处理，或者让 getInsightByJournalId 内部容错
  // 这里我们假设这两个函数内部已经处理了错误并返回 null，所以可以用 Promise.all
  const [issue, possibleInsight] = await Promise.all([
    getAiContentByJournalId(slug, lang),
    // 注意：这里需要 issue 的 journal_id 或 id，但 issue 还没拿到。
    // 所以这是一个依赖关系。我们不能完全并行，除非我们先假设 slug 就是 journal_id（在这个项目中通常是的）
    // 为了安全起见，我们可以先获取 issue，然后再获取 insight。
    // 但是，我们可以利用 React 的 request memoization 特性。
    // 如果我们在 getInsightByJournalId 内部也需要 issue 信息，那没办法。
    // 但这里 getInsightByJournalId 只需要 ID。
    // 在这个项目中，URL 中的 slug 通常就是 journal_id。
    getInsightByJournalId(slug) 
  ])

  // 如果 slug 不是 journal_id，上面的 getInsightByJournalId(slug) 可能会失败。
  // 但我们目前的路由设计是 /issues/[journal_id]，所以 slug === journal_id。
  // 唯一的特例是如果 slug 是 uuid (pre-journal_id era)，但那种数据应该很少了。
  // 所以上面的并行是合理的尝试。

  if (!issue) {
    notFound()
  }
  
  // 如果上面的并行尝试失败了（比如 slug 不等于 journal_id），我们再试一次用正确的 journal_id
  let insight = possibleInsight;
  if (!insight && issue.journal_id && issue.journal_id !== slug) {
     insight = await getInsightByJournalId(issue.journal_id);
  }

  // 检查是否存在英文版本（用于 hreflang）
  // 并行检查
  let hasEnVersion = false;
  if (lang === 'zh-CN') {
    const enIssue = await getAiContentByJournalId(slug, 'en');
    hasEnVersion = !!enIssue;
  } else {
    const zhIssue = await getAiContentByJournalId(slug, 'zh-CN');
    hasEnVersion = !!zhIssue;
  }

  // 格式化日期
  const date = new Date(issue.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  // 处理内容
  // 优先使用 content 字段，如果没有则使用 summary
  const rawContent = issue.content || issue.summary;
  const sections = formatHtmlContent(rawContent);
  
  // 提取标签
  // 优先使用数据库中的 tags 字段（如果是 JSON 数组）
  let tags: string[] = [];
  if (issue.tags) {
    if (Array.isArray(issue.tags)) {
      tags = issue.tags;
    } else if (typeof issue.tags === 'string') {
      try {
        // 尝试解析 JSON 字符串
        if (issue.tags.trim().startsWith('[') && issue.tags.trim().endsWith(']')) {
          const parsed = JSON.parse(issue.tags);
          if (Array.isArray(parsed)) {
            tags = parsed.map(t => String(t));
          }
        } else {
          // 如果不是 JSON 数组，且包含逗号，尝试分割
          if (issue.tags.includes(',')) {
            tags = issue.tags.split(',').map(t => t.trim());
          } else {
            tags = [issue.tags];
          }
        }
      } catch (e) {
        console.warn('Failed to parse tags:', e);
        // 解析失败，回退到从摘要提取
        tags = extractTagsFromSummary(issue.summary);
      }
    }
  } else {
    // 如果没有 tags 字段，从摘要提取
    tags = extractTagsFromSummary(issue.summary);
  }
  
  // 确保标签不为空
  if (tags.length === 0) {
    tags = ['AI News'];
  }

  // 构建 issue 数据
  const issueData = {
    title: issue.title,
    date: date,
    summary: issue.summary,
    imgUrl: issue.imgUrl || '',
    tagCategories: [
      {
        title: 'TOPICS',
        tags: tags
      }
    ],
    sections: sections
  }

  // 转换 Insight 数据
  const relatedInsight = insight ? {
    slug: insight.slug,
    title: insight.title,
    excerpt: insight.excerpt
  } : null

  return (
    <IssueDetailContent 
      issue={issueData} 
      issueId={slug}
      hasEnVersion={hasEnVersion}
      initialLang={lang}
      relatedInsight={relatedInsight}
    />
  )
}
