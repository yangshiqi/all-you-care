// src/app/[lang]/issues/[slug]/page.tsx
import { Metadata } from 'next'
import { getAiContentByJournalId, getAllAiContentIds } from '@/lib/api'
import { IssueDetailContent } from '@/components/IssueDetailContent'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{
    slug: string
    lang: string
  }>
}

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  const { lang } = params
  
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string, lang: string }> }): Promise<Metadata> {
  const { slug, lang } = await params
  const issue = await getAiContentByJournalId(slug, lang)

  if (!issue) {
    return {
      title: 'Not Found',
      description: 'The issue you are looking for does not exist.',
    }
  }

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

// 新 pipeline 的 render 输出在 body 顶部带 <h1> 标题 / <p class="subtitle"> 日期 /
// <img class="hero-img"> 封面三件套，与外层 header 重复。这里剥掉避免重复展示。
function stripDuplicateHeader(content: string): string {
  if (!content) return '';
  let cleaned = content;
  cleaned = cleaned.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, '');
  cleaned = cleaned.replace(/<p[^>]*class=["'][^"']*\bsubtitle\b[^"']*["'][^>]*>[\s\S]*?<\/p>/i, '');
  cleaned = cleaned.replace(/<img[^>]*class=["'][^"']*\bhero-img\b[^"']*["'][^>]*\/?>/i, '');
  return cleaned;
}

// 辅助函数：解析 HTML 内容
function formatHtmlContent(htmlContent: string) {
  if (!htmlContent) return [];
  
  // 1. 提取 body 内容
  let content = extractBodyContent(htmlContent).replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 1.5 移除与外层 header 重复的 h1/subtitle/hero-img（新 pipeline render 输出）
  content = stripDuplicateHeader(content);

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
  if (firstH2Index === -1 && content.trim()) {
    // 如果没有 h2，整个内容作为一个 section
    sections.push({
      id: `section-main`,
      title: 'Main Content',
      content: content.trim()
    });
    return sections;
  }
  
  while ((match = h2Regex.exec(content)) !== null) {
    const title = match[1].replace(/<[^>]+>/g, '').trim(); // 移除标题中的 HTML 标签
    const sectionContent = match[2].trim();
    
    if (sectionContent || title) {
      sections.push({
        id: `section-${index}`,
        title: title || `Section ${index + 1}`,
        content: sectionContent
      });
      index++;
    }
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

  const issue = await getAiContentByJournalId(slug, lang)

  if (!issue) {
    notFound()
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
  // 使用固定的 locale 格式化日期，防止 Hydration 错误
  const formattedDate = new Date(issue.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const issueData = {
    title: issue.title,
    date: formattedDate,
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

  // 对 sections 进行最终的清洗，确保 server/client 数据完全一致
  const sanitizedSections = sections.map(s => ({
    ...s,
    content: s.content.trim().replace(/\r\n/g, '\n')
  }))

  // ---- schema.org NewsArticle JSON-LD ---------------------------------------
  // Helps Google Discover / News surface daily issues; matches the OpenGraph
  // metadata above so social previews and search structured data stay in sync.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snapallx.com'
  const articleUrl = `${baseUrl}/${lang}/issues/${issue.journal_id || issue.id}`
  const articleImage = issue.imgUrl
    ? (issue.imgUrl.startsWith('http')
        ? issue.imgUrl
        : `${baseUrl}${issue.imgUrl.startsWith('/') ? '' : '/'}${issue.imgUrl}`)
    : `${baseUrl}/x_welcome.jpg`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: issue.title,
    description: issue.summary,
    image: [articleImage],
    datePublished: issue.created_at,
    dateModified: issue.created_at,
    inLanguage: lang === 'zh-CN' ? 'zh-CN' : 'en',
    articleSection: 'AI',
    keywords: tags.join(', '),
    author: { '@type': 'Organization', name: 'SnapAllX', url: baseUrl },
    publisher: {
      '@type': 'Organization',
      name: 'SnapAllX',
      logo: { '@type': 'ImageObject', url: `${baseUrl}/x_welcome.jpg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
  }
  // Escape `<` to prevent any LLM-generated `</script>` substring from breaking
  // out of the script tag. `<` is JSON-safe and parses back as `<`.
  const jsonLdSafe = JSON.stringify(jsonLd).replace(/</g, '\\u003c')

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdSafe }}
      />
      <IssueDetailContent
        issue={{
          ...issueData,
          sections: sanitizedSections
        }}
        issueId={slug}
        hasEnVersion={hasEnVersion}
        initialLang={lang}
      />
    </>
  )
}
