import { Metadata } from "next";
import { Header } from "@/components/Header";
import { TagIssuesList } from "../../../components/TagIssuesList";
import { getAllAiContents, extractTagsFromContent } from "@/lib/api";

interface PageProps {
  params: Promise<{ tag: string }>
}

// 生成静态参数 - Next.js静态导出必需
export async function generateStaticParams() {
  try {
    // 从Supabase获取所有AI内容
    const contents = await getAllAiContents();
    
    // 收集所有唯一的标签
    const tagSet = new Set<string>();
    contents.forEach(content => {
      const tags = extractTagsFromContent(content.tags);
      tags.forEach(tag => tagSet.add(tag));
    });
    
    // 返回所有标签参数
    return Array.from(tagSet).map(tag => ({
      tag: encodeURIComponent(tag),
    }));
  } catch (error) {
    console.error('Error generating static params for tags:', error);
    // 返回空数组，避免构建失败
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  const title = `Tag: ${decoded} | AINews`
  const description = `Browse AI news issues tagged with ${decoded}.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  }
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TagIssuesList tag={decoded} />
    </div>
  )
}


