import { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { IssuesList } from "@/components/IssuesList";
import { getAllAiContentsPaginated } from "@/lib/api";

export const metadata: Metadata = {
  title: "All Issues | AINews - Daily AI Roundup for Engineers",
  description: "Browse all AI news issues and stay up to date with the latest developments in artificial intelligence.",
  openGraph: {
    title: "All Issues | AINews",
    description: "Browse all AI news issues and stay up to date with the latest developments in artificial intelligence.",
    type: "website",
  },
};

export default async function IssuesPage() {
  // 服务端渲染第一页数据（SSR）
  const pageSize = 10;
  const lang = 'en'; // 默认语言，客户端会通过 i18n 重新获取
  
  // 获取第一页数据作为初始数据
  let initialData;
  try {
    initialData = await getAllAiContentsPaginated(1, pageSize, lang);
  } catch (error) {
    console.error('Error fetching initial issues:', error);
    // 如果出错，返回空数据
    initialData = {
      data: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 0
    };
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Suspense fallback={
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading issues...</p>
            </div>
          </div>
        </main>
      }>
        <IssuesList 
          initialIssues={initialData.data}
          initialTotal={initialData.total}
          initialPage={initialData.page}
          initialPageSize={initialData.pageSize}
          initialTotalPages={initialData.totalPages}
        />
      </Suspense>
    </div>
  );
}
