import { Metadata } from "next";
import { Header } from "@/components/Header";
import { TagsList } from "@/components/TagsList";
import { getAbsoluteUrl } from "@/lib/utils";
import { isValidLanguage } from "@/lib/i18n-utils";
import { notFound } from "next/navigation";

// 导入翻译资源
import { en } from "@/lib/locales/en";
import { zh_CN } from "@/lib/locales/zh_CN";

// ISR：列表页每 24 小时后台重建一次（stale-while-revalidate），
// 保证 Supabase 新增内容无需重新部署即可自动上线。
export const revalidate = 86400;

const translations = {
  en: en.translation,
  'zh-CN': zh_CN.translation,
};

interface TagsPageProps {
  params: Promise<{
    lang: string;
  }>;
}

const ogImageUrl = getAbsoluteUrl("/x_welcome.jpg");

export async function generateMetadata({ params }: TagsPageProps): Promise<Metadata> {
  const { lang } = await params;
  
  if (!isValidLanguage(lang)) {
    return {
      title: "All Tags | [AI]News",
    };
  }
  
  const t = translations[lang];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snapallx.com';
  
  // 生成所有语言版本的 URL
  const alternateLanguages: Record<string, string> = {
    'en': `${baseUrl}/en/tags`,
    'zh-CN': `${baseUrl}/zh-CN/tags`,
  };
  
  return {
    title: t.metadata.tags.title,
    description: t.metadata.tags.description,
    alternates: {
      canonical: `${baseUrl}/${lang}/tags`,
      languages: alternateLanguages,
    },
    openGraph: {
      title: t.metadata.tags.title,
      description: t.metadata.tags.description,
      type: "website",
      locale: lang === 'en' ? 'en_US' : 'zh_CN',
      alternateLocale: lang === 'en' ? 'zh_CN' : 'en_US',
      url: `${baseUrl}/${lang}/tags`,
      siteName: "[AI]News",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t.metadata.tags.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t.metadata.tags.title,
      description: t.metadata.tags.description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t.metadata.tags.title,
        },
      ],
    },
  };
}

export default async function TagsPage({ params }: TagsPageProps) {
  const { lang } = await params;
  
  if (!isValidLanguage(lang)) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header initialLang={lang} />
      <TagsList />
    </div>
  );
}

