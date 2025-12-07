import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { IssueDetailContent } from "@/components/IssueDetailContent";
import { getAiContentByJournalId, extractTagsFromContent, getAllAiContents } from "@/lib/api";
import { getAbsoluteUrl } from "@/lib/utils";

interface IssueDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// 生成静态参数 - Next.js静态导出必需
export async function generateStaticParams() {
  try {
    // 从Supabase获取所有AI内容
    const contents = await getAllAiContents();
    
    // 返回所有slug参数（确保转换为字符串）
    return contents.map((content) => ({
      slug: String(content.id),
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    // 返回空数组，避免构建失败
    return [];
  }
}

// 从 Supabase 获取期刊数据
async function getIssueData(slug: string) {
  try {
    // 尝试从 Supabase 获取数据
    const supabaseData = await getAiContentByJournalId(slug);
    
    if (supabaseData) {
      // 格式化日期
      const date = new Date(supabaseData.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      // 解析 content 字段中的 HTML 内容
      const formattedContent = formatHtmlContent(supabaseData.content);
      
      // 处理图片 URL：如果是 https 开头则保持原值，否则使用 getAbsoluteUrl 转换
      const imgUrl = supabaseData.imgUrl?.startsWith('https')
        ? supabaseData.imgUrl
        : getAbsoluteUrl(supabaseData.imgUrl || '/ainews/default.jpg');

      return {
        title: supabaseData.title,
        imgUrl: imgUrl,
        date: date,
        summary: supabaseData.summary,
        tagCategories: generateTagCategories(supabaseData.tags), // 从 tags 字段生成标签
        sections: formattedContent // 格式化后的内容
      };
    }

    // 如果 Supabase 中没有数据，返回 null
    return null;
  } catch (error) {
    console.error('Error fetching issue data:', error);
    return null;
  }
}

// 从 HTML 中提取 body 标签内的内容（不包括 body 标签本身）
function extractBodyContent(html: string): string {
  // 使用正则表达式匹配 <body> 标签及其内容
  // 匹配 <body> 或 <body ...> 以及 </body>，使用非贪婪模式
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  
  if (bodyMatch && bodyMatch[1]) {
    // 找到 body 标签内的内容，返回它（不包括 body 标签）
    return bodyMatch[1].trim();
  }
  
  // 如果没有找到 body 标签，返回原内容
  return html;
}

// 从 HTML 内容中过滤掉 tags 相关的 section
function removeTagsSection(html: string): string {
  if (!html) return html;
  
  let result = html;
  let previousResult = '';
  
  // 循环处理，直到没有更多匹配（处理嵌套情况）
  while (result !== previousResult) {
    previousResult = result;
    
    // 0. 移除特定的标题标签（中文和英文）
    // 移除 <h1>AI新闻简报</h1> 及其变体
    result = result.replace(/<h1[^>]*>[\s]*AI 新闻简报：(.*?)[\s]*<\/h1>/gi, '');
    result = result.replace(/<h1[^>]*>[\s]*AI News Briefing[\s]*<\/h1>/gi, '');

    // 移除 <h2>AI新闻分类汇总</h2> 及其变体
    result = result.replace(/<h2[^>]*>[\s]*AI 新闻分类汇总[\s]*<\/h2>/gi, '');
    
    // 0.5. 移除带有 class="hero-img" 的图片标签
    result = result.replace(/<img[^>]*class\s*=\s*["']hero-img["'][^>]*\/?>/gi, '');
    
    // 1. 移除包含 class="tags" 的容器元素（div, section, aside 等）及其所有内容
    // 匹配标签名，然后匹配到对应的结束标签
    result = result.replace(/<(div|section|aside)[^>]*class\s*=\s*["'][^"']*\btags\b[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi, '');
    
    // 2. 移除包含 id="tags" 或 id="tag" 的元素及其所有内容
    result = result.replace(/<(div|section|aside)[^>]*id\s*=\s*["']tags?["'][^>]*>[\s\S]*?<\/\1>/gi, '');
    
    // 3. 移除包含 class="tag" 的单个标签元素（span, div, a 等）
    result = result.replace(/<(span|div|a)[^>]*class\s*=\s*["'][^"']*\btag\b[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi, '');
    
    // 4. 移除包含"相关标签"或"Related Tags"文本的 section 元素（包括标题中包含该文本的情况）
    result = result.replace(/<section[^>]*>[\s\S]*?(?:相关标签|Related Tags)[\s\S]*?<\/section>/gi, '');
    
    // 5. 通用匹配：移除任何包含 class="tags" 的元素（作为后备方案）
    result = result.replace(/<[^>]+class\s*=\s*["'][^"']*\btags\b[^"']*["'][^>]*>[\s\S]*?<\/[^>]+>/gi, '');
  }
  
  return result.trim();
}

// 格式化 HTML 内容
function formatHtmlContent(content: string | null | undefined) {
  // 处理 null 或 undefined 的情况
  if (!content) {
    return [{
      id: "main-content",
      title: "Content",
      content: "<p>No content available.</p>"
    }];
  }

  // 提取 body 标签内的内容（如果存在）
  let extractedContent = extractBodyContent(content);
  
  // 过滤掉 tags 相关的 section
  extractedContent = removeTagsSection(extractedContent);

  // 如果内容已经是 HTML 格式，直接返回
  if (extractedContent.includes('<h') || extractedContent.includes('<p>') || extractedContent.includes('<div>')) {
    return [{
      id: "main-content",
      title: "Content",
      content: extractedContent
    }];
  }

  // 如果是纯文本，转换为 HTML 格式
  const paragraphs = extractedContent.split('\n\n').filter(p => p.trim());
  
  return [{
    id: "main-content",
    title: "Content",
    content: paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n')
  }];
}

// 从 tags 字段生成标签分类
function generateTagCategories(tags: string | null | undefined) {
  // 使用统一的标签提取函数
  const extractedTags = extractTagsFromContent(tags);

  return [
    {
      title: "Topics",
      tags: extractedTags
    }
  ];
}

export async function generateMetadata({ params }: IssueDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const issue = await getIssueData(slug);
  
  if (!issue) {
    return {
      title: "Issue Not Found",
      description: "The requested issue could not be found.",
    };
  }

  const ogImageUrl = getAbsoluteUrl("/x_welcome.jpg");

  return {
    title: `${issue.title} | AINews`,
    description: issue.summary,
    openGraph: {
      title: issue.title,
      description: issue.summary,
      type: "article",
      publishedTime: issue.date,
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
      card: "summary_large_image",
      title: issue.title,
      description: issue.summary,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: issue.title,
        },
      ],
    },
  };
}

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { slug } = await params;
  const issue = await getIssueData(slug);
  
  if (!issue) {
    notFound();
  }

  // 检查 en 版本是否存在
  const enVersion = await getAiContentByJournalId(slug, 'en');
  const hasEnVersion = !!enVersion;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <IssueDetailContent issue={issue} issueId={slug} hasEnVersion={hasEnVersion} />
    </div>
  );
}
