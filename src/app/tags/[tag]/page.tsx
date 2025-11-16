import { Metadata } from "next";
import { Header } from "@/components/Header";
import { TagIssuesList } from "../../../components/TagIssuesList";
import { getAllTags } from "@/lib/api";

interface PageProps {
  params: Promise<{ tag: string }>
}

// 允许动态参数，即使静态生成失败也能动态生成页面
export const dynamicParams = true;

// 生成静态参数 - Next.js静态导出必需
// 注意：为了确保生成的静态路径与链接中的 URL 编码一致，这里返回编码后的标签名称
export async function generateStaticParams() {
  try {
    const tags = await getAllTags();
    // 返回编码后的标签名称，确保与链接中的 encodeURIComponent 一致
    // 这样生成的静态页面路径就能正确匹配用户访问的编码 URL
    return tags.map(t => ({ tag: encodeURIComponent(t.name) }));
  } catch (error) {
    console.error('Error generating static params for tags:', error);
    // 返回空数组，避免构建失败
    // 由于设置了 dynamicParams = true，即使返回空数组，也能动态生成页面
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params
  // Next.js 会自动解码 URL 参数，但如果传入的是编码后的值，需要手动解码
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
  // Next.js 会自动解码 URL 参数，但如果传入的是编码后的值，需要手动解码
  // 使用 try-catch 确保即使解码失败也能正常工作
  let decoded: string
  try {
    decoded = decodeURIComponent(tag)
  } catch {
    // 如果解码失败（可能已经是解码后的值），直接使用原值
    decoded = tag
  }
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TagIssuesList tag={decoded} />
    </div>
  )
}


