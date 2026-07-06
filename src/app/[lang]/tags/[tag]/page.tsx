import { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { TagIssuesList } from "@/components/TagIssuesList";
import { getAllTags } from "@/lib/api";
import { getAbsoluteUrl } from "@/lib/utils";
import { isValidLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n-utils";
import { notFound } from "next/navigation";

// 导入翻译资源
import { en } from "@/lib/locales/en";
import { zh_CN } from "@/lib/locales/zh_CN";

const translations = {
  en: en.translation,
  'zh-CN': zh_CN.translation,
};

interface TagPageProps {
  params: Promise<{
    lang: string;
    tag: string;
  }>;
}

export async function generateStaticParams() {
  try {
    const params: Array<{ lang: string; tag: string }> = [];
    
    // 为每种语言分别获取对应的标签
    for (const lang of SUPPORTED_LANGUAGES) {
      const tags = await getAllTags(lang);
      for (const tag of tags) {
        params.push({
          lang,
          tag: encodeURIComponent(tag.name),
        });
      }
    }
    
    return params;
  } catch (error) {
    console.error('Error generating static params for tags:', error);
    return [];
  }
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { lang, tag } = await params;
  
  if (!isValidLanguage(lang)) {
    return {
      title: "Tag | [AI]News",
    };
  }
  
  // Next.js 的路由匹配器会自动解码 URL 参数，所以 tag 已经是解码后的值
  // 但如果 Next.js 没有自动解码（某些边缘情况），我们需要手动解码
  let decoded: string;
  try {
    // 尝试解码，如果已经是解码后的值，decodeURIComponent 会返回原值
    decoded = decodeURIComponent(tag);
  } catch {
    // 如果解码失败，直接使用原值
    decoded = tag;
  }
  
  const t = translations[lang];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snapallx.com';
  const ogImageUrl = getAbsoluteUrl("/x_welcome.jpg");
  
  // 生成所有语言版本的 URL
  const alternateLanguages: Record<string, string> = {};
  SUPPORTED_LANGUAGES.forEach((supportedLang) => {
    alternateLanguages[supportedLang] = `${baseUrl}/${supportedLang}/tags/${encodeURIComponent(decoded)}`;
  });
  
  // 使用翻译模板生成标题和描述
  const title = t.metadata.tagDetail.title.replace('{{tag}}', decoded);
  const description = t.metadata.tagDetail.description.replace('{{tag}}', decoded);
  
  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${lang}/tags/${encodeURIComponent(decoded)}`,
      languages: alternateLanguages,
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: lang === 'en' ? 'en_US' : 'zh_CN',
      alternateLocale: lang === 'en' ? 'zh_CN' : 'en_US',
      url: `${baseUrl}/${lang}/tags/${encodeURIComponent(decoded)}`,
      siteName: "[AI]News",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { lang, tag } = await params;
  
  if (!isValidLanguage(lang)) {
    notFound();
  }
  
  // 解码 tag 参数
  let decoded: string;
  try {
    decoded = decodeURIComponent(tag);
  } catch {
    decoded = tag;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header initialLang={lang} />
      <Suspense fallback={
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading...</p>
            </div>
          </div>
        </main>
      }>
        <TagIssuesList tag={decoded} />
      </Suspense>
    </div>
  );
}

