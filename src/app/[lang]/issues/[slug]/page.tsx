import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { IssueDetailContent } from "@/components/IssueDetailContent";
import { getAiContentByJournalId, extractTagsFromContent, getAllAiContents } from "@/lib/api";
import { getAbsoluteUrl } from "@/lib/utils";
import { isValidLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n-utils";

// 导入翻译资源
import { en } from "@/lib/locales/en";
import { zh_CN } from "@/lib/locales/zh_CN";

const translations = {
  en: en.translation,
  'zh-CN': zh_CN.translation,
};

interface IssueDetailPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

// 生成静态参数 - Next.js静态导出必需
export async function generateStaticParams() {
  try {
    // 为每种语言和每个 slug 生成参数
    const params: Array<{ lang: string; slug: string }> = [];

    for (const lang of SUPPORTED_LANGUAGES) {
      // 为每种语言分别获取对应的内容，只生成存在的语言版本
      const contents = await getAllAiContents(lang);

      for (const content of contents) {
        // 验证该语言版本是否真的存在
        const journalId = content.journal_id || content.id;
        const issueData = await getAiContentByJournalId(String(journalId), lang);
        if (issueData) {
          params.push({
            lang,
            slug: String(journalId),
          });
        }
      }
    }

    return params;
  } catch (error) {
    console.error('Error generating static params:', error);
    // 返回空数组，避免构建失败
    return [];
  }
}

// 从 Supabase 获取期刊数据
async function getIssueData(slug: string, lang?: string) {
  try {
    // 尝试从 Supabase 获取数据
    const supabaseData = await getAiContentByJournalId(slug, lang);

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
  const { lang, slug } = await params;

  if (!isValidLanguage(lang)) {
    return {
      title: "Issue Not Found | [AI]News",
    };
  }

  const issue = await getIssueData(slug, lang);

  if (!issue) {
    return {
      title: "Issue Not Found | [AI]News",
      description: "The requested issue could not be found.",
    };
  }

  const t = translations[lang];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snapallx.com';
  //const ogImageUrl = getAbsoluteUrl("/x_welcome.jpg");
  const ogImageUrl = issue.imgUrl

  // 生成所有语言版本的 URL
  const alternateLanguages: Record<string, string> = {};
  SUPPORTED_LANGUAGES.forEach((supportedLang) => {
    alternateLanguages[supportedLang] = `${baseUrl}/${supportedLang}/issues/${slug}`;
  });

  // 使用翻译模板生成标题和描述
  const title = t.metadata.issueDetail.title.replace('{{title}}', issue.title);
  const description = t.metadata.issueDetail.description.replace('{{summary}}', issue.summary);

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${lang}/issues/${slug}`,
      languages: alternateLanguages,
    },
    openGraph: {
      title: issue.title,
      description: issue.summary,
      type: "article",
      locale: lang === 'en' ? 'en_US' : 'zh_CN',
      alternateLocale: lang === 'en' ? 'zh_CN' : 'en_US',
      url: `${baseUrl}/${lang}/issues/${slug}`,
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
  const { lang, slug } = await params;

  if (!isValidLanguage(lang)) {
    notFound();
  }

  const issue = await getIssueData(slug, lang);

  if (!issue) {
    notFound();
  }

  // 检查 en 版本是否存在
  const enVersion = await getAiContentByJournalId(slug, 'en');
  const hasEnVersion = !!enVersion;

  return (
    <div className="min-h-screen bg-background">
      <Header initialLang={lang} />
      <IssueDetailContent issue={issue} issueId={slug} hasEnVersion={hasEnVersion} initialLang={lang} />
    </div>
  );
}

