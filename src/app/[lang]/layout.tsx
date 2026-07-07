import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n-utils";
import { getAbsoluteUrl } from "@/lib/utils";
import { Footer } from "@/components/Footer";
import { LangSync } from "@/components/LangSync";

// 导入翻译资源
import { en } from "@/lib/locales/en";
import { zh_CN } from "@/lib/locales/zh_CN";

const translations = {
  en: en.translation,
  'zh-CN': zh_CN.translation,
};

interface LangLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    lang: string;
  }>;
}

// 生成静态参数
export async function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((lang) => ({
    lang,
  }));
}

// 生成元数据
export async function generateMetadata({ params }: LangLayoutProps): Promise<Metadata> {
  const { lang } = await params;
  
  if (!isValidLanguage(lang)) {
    return {
      title: "[AI]News",
    };
  }
  
  const t = translations[lang];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snapallx.com';
  const ogImageUrl = getAbsoluteUrl("/x_welcome.jpg");
  
  // 生成所有语言版本的 URL
  const alternateLanguages: Record<string, string> = {};
  SUPPORTED_LANGUAGES.forEach((supportedLang) => {
    alternateLanguages[supportedLang] = `${baseUrl}/${supportedLang}`;
  });
  
  return {
    title: t.metadata.home.title,
    description: t.metadata.home.description,
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
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;
  
  // 验证语言参数
  if (!isValidLanguage(lang)) {
    notFound();
  }

  return (
    <>
      <LangSync lang={lang} />
      {children}
      <Footer initialLang={lang} />
    </>
  );
}

