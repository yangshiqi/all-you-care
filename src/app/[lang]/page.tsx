import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { RecentIssues } from "@/components/RecentIssues";
import { Manifesto } from "@/components/Manifesto";
import { Metadata } from "next";
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

interface HomePageProps {
  params: Promise<{
    lang: string;
  }>;
}

const ogImageUrl = getAbsoluteUrl("/x_welcome.jpg");

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { lang } = await params;
  
  if (!isValidLanguage(lang)) {
    return {
      title: "[AI]News",
    };
  }
  
  const t = translations[lang];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snapallx.com';
  
  // 生成所有语言版本的 URL
  const alternateLanguages: Record<string, string> = {
    'en': `${baseUrl}/en`,
    'zh-CN': `${baseUrl}/zh-CN`,
  };
  
  return {
    title: t.metadata.home.title,
    description: t.metadata.home.description,
    keywords: lang === 'en' 
      ? "AI news, artificial intelligence, AI engineer, AI newsletter, machine learning, deep learning"
      : "AI资讯, 人工智能, AI工程师, AI新闻, 机器学习, 深度学习, AI newsletter, artificial intelligence, machine learning, deep learning",
    authors: [{ name: "SnapAllx.ai" }],
    alternates: {
      canonical: `${baseUrl}/${lang}`,
      languages: alternateLanguages,
    },
    openGraph: {
      title: t.metadata.home.title,
      description: t.metadata.home.description,
      type: "website",
      locale: lang === 'en' ? 'en_US' : 'zh_CN',
      alternateLocale: lang === 'en' ? 'zh_CN' : 'en_US',
      url: `${baseUrl}/${lang}`,
      siteName: "[AI]News",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t.metadata.home.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t.metadata.home.title,
      description: t.metadata.home.description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t.metadata.home.title,
        },
      ],
    },
  };
}

export default async function Home({ params }: HomePageProps) {
  const { lang } = await params;
  
  if (!isValidLanguage(lang)) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header initialLang={lang} />
      <main>
        <Hero />
        <Manifesto />
        <RecentIssues />
      </main>
    </div>
  );
}
