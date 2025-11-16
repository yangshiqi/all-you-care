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
// 注意：Next.js 会自动处理 URL 编码，所以这里返回未编码的标签名称
// Next.js 的路由匹配器会自动解码 URL 参数，所以 generateStaticParams 应该返回未编码的值
export async function generateStaticParams() {
  try {
    const tags = await getAllTags();
    // 返回未编码的标签名称，Next.js 会自动处理 URL 编码
    return tags.map(t => ({ tag: t.name }));
  } catch (error) {
    console.error('Error generating static params for tags:', error);
    // 返回空数组，避免构建失败
    // 由于设置了 dynamicParams = true，即使返回空数组，也能动态生成页面
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params
  // Next.js 的路由匹配器会自动解码 URL 参数，所以 tag 已经是解码后的值
  // 但如果 Next.js 没有自动解码（某些边缘情况），我们需要手动解码
  let decoded: string
  try {
    // 尝试解码，如果已经是解码后的值，decodeURIComponent 会返回原值
    decoded = decodeURIComponent(tag)
  } catch {
    // 如果解码失败，直接使用原值
    decoded = tag
  }
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
  // Next.js 的路由匹配器会自动解码 URL 参数，所以 tag 应该是解码后的值
  // 但如果 Next.js 没有自动解码（某些边缘情况），我们需要手动解码
  let decoded: string
  try {
    // 尝试解码，如果已经是解码后的值，decodeURIComponent 会返回原值
    decoded = decodeURIComponent(tag)
  } catch {
    // 如果解码失败，直接使用原值
    decoded = tag
  }
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TagIssuesList tag={decoded} />
    </div>
  )
}


