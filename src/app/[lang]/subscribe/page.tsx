import { Metadata } from "next";
import { Header } from "@/components/Header";
import { SubscribeHero } from "@/components/SubscribeHero";
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

interface SubscribePageProps {
  params: Promise<{
    lang: string;
  }>;
}

const ogImageUrl = getAbsoluteUrl("/x_welcome.jpg");

export async function generateMetadata({ params }: SubscribePageProps): Promise<Metadata> {
  const { lang } = await params;

  if (!isValidLanguage(lang)) {
    return {
      title: "Subscribe | [AI]News",
    };
  }

  const t = translations[lang];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snapallx.com';

  const alternateLanguages: Record<string, string> = {
    'en': `${baseUrl}/en/subscribe`,
    'zh-CN': `${baseUrl}/zh-CN/subscribe`,
  };

  return {
    title: t.subscribePage.metaTitle,
    description: t.subscribePage.metaDescription,
    alternates: {
      canonical: `${baseUrl}/${lang}/subscribe`,
      languages: alternateLanguages,
    },
    openGraph: {
      title: t.subscribePage.metaTitle,
      description: t.subscribePage.metaDescription,
      type: "website",
      locale: lang === 'en' ? 'en_US' : 'zh_CN',
      alternateLocale: lang === 'en' ? 'zh_CN' : 'en_US',
      url: `${baseUrl}/${lang}/subscribe`,
      siteName: "[AI]News",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t.subscribePage.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t.subscribePage.metaTitle,
      description: t.subscribePage.metaDescription,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t.subscribePage.metaTitle,
        },
      ],
    },
  };
}

export default async function SubscribePage({ params }: SubscribePageProps) {
  const { lang } = await params;

  if (!isValidLanguage(lang)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <Header initialLang={lang} />
      <main>
        <SubscribeHero />
      </main>
    </div>
  );
}
