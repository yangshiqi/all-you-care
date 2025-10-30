import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { IssueDetailContent } from "@/components/IssueDetailContent";
import { getAiContentById, extractTagsFromContent, getAllAiContents } from "@/lib/api";

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
    const supabaseData = await getAiContentById(slug);
    
    if (supabaseData) {
      // 格式化日期
      const date = new Date(supabaseData.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      // 解析 content 字段中的 HTML 内容
      const formattedContent = formatHtmlContent(supabaseData.content);
      
      return {
        title: supabaseData.title,
        date: date,
        summary: supabaseData.summary,
        intro: generateIntro(date), // 生成介绍文本
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

  // 如果内容已经是 HTML 格式，直接返回
  if (content.includes('<h') || content.includes('<p>') || content.includes('<div>')) {
    return [{
      id: "main-content",
      title: "Content",
      content: content
    }];
  }

  // 如果是纯文本，转换为 HTML 格式
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  return [{
    id: "main-content",
    title: "Content",
    content: paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n')
  }];
}

// 生成介绍文本
function generateIntro(date: string) {
  return `AI News for ${date}. We checked multiple sources including subreddits, Twitter, and Discord channels for you. This content was automatically generated and curated from our AI content database.`;
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

  return {
    title: `${issue.title} | AINews`,
    description: issue.summary,
    openGraph: {
      title: issue.title,
      description: issue.summary,
      type: "article",
      publishedTime: issue.date,
    },
    twitter: {
      card: "summary_large_image",
      title: issue.title,
      description: issue.summary,
    },
  };
}

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { slug } = await params;
  const issue = await getIssueData(slug);
  
  if (!issue) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <IssueDetailContent issue={issue} />
    </div>
  );
}
