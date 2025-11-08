import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "[AI]News - 打破信息茧房，获取行业资讯",
  description: "打破每个人的信息茧房，收集行业内的新闻，帮助大家压缩信息、节省时间、缓解焦虑。我们汇总 AI Discord、Reddit、X/Twitter、HackerNews、InfoQ、TechCrunch、CNCF、NVIDIA、Meta、OpenAI、Google、Microsoft、Amazon、Apple等平台的内容，定时为您发送精选资讯！",
  keywords: "AI资讯, 人工智能, AI工程师, AI新闻, 机器学习, 深度学习, AI newsletter, artificial intelligence, machine learning, deep learning",
  authors: [{ name: "SnapAllx.ai" }],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    alternateLocale: "en_US",
    title: "[AI]News - 打破信息茧房，获取行业资讯",
    description: "打破每个人的信息茧房，收集行业内的新闻，帮助大家压缩信息、节省时间、缓解焦虑。",
    siteName: "[AI]News",
    images: [
      {
        url: "",
        width: 1200,
        height: 630,
        alt: "[AI]News - 打破信息茧房，获取行业资讯",
      },
    ],
  },
  /*alternates: {
    canonical: "https://ai.snapallx.com/",
    languages: {
      "en": "https://ai.snapallx.com/?lang=en",
      "zh-CN": "https://ai.snapallx.com/",
    },
  },*/
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
