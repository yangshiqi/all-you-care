import { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { IssuesList } from "@/components/IssuesList";
import { getAllAiContentsPaginated } from "@/lib/api";
import { getAbsoluteUrl } from "@/lib/utils";
import { isValidLanguage } from "@/lib/i18n-utils";
import { notFound } from "next/navigation";

// 导入翻译资源
import { en } from "@/lib/locales/en";
import { zh_CN } from "@/lib/locales/zh_CN";

const translations = {
  en: en.translation,
  'zh-CN': zh_CN.translation,
};

interface IssuesPageProps {
  params: Promise<{
    lang: string;
  }>;
}

const ogImageUrl = getAbsoluteUrl("/x_welcome.jpg");

export async function generateMetadata({ params }: IssuesPageProps): Promise<Metadata> {
  const { lang } = await params;
  
  if (!isValidLanguage(lang)) {
    return {
      title: "All Issues | [AI]News",
    };
  }
  
  const t = translations[lang];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snapallx.com';
  
  // 生成所有语言版本的 URL
  const alternateLanguages: Record<string, string> = {
    'en': `${baseUrl}/en/issues`,
    'zh-CN': `${baseUrl}/zh-CN/issues`,
  };
  
  return {
    title: t.metadata.issues.title,
    description: t.metadata.issues.description,
    alternates: {
      canonical: `${baseUrl}/${lang}/issues`,
      languages: alternateLanguages,
    },
    openGraph: {
      title: t.metadata.issues.title,
      description: t.metadata.issues.description,
      type: "website",
      locale: lang === 'en' ? 'en_US' : 'zh_CN',
      alternateLocale: lang === 'en' ? 'zh_CN' : 'en_US',
      url: `${baseUrl}/${lang}/issues`,
      siteName: "[AI]News",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t.metadata.issues.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t.metadata.issues.title,
      description: t.metadata.issues.description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t.metadata.issues.title,
        },
      ],
    },
  };
}

export default async function IssuesPage({ params }: IssuesPageProps) {
  const { lang } = await params;
  
  if (!isValidLanguage(lang)) {
    notFound();
  }
  
  // 服务端渲染第一页数据（SSR）
  const pageSize = 10;
  
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
      <Header initialLang={lang} />
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

