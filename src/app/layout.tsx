import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AINews - Daily AI Roundup for Engineers | AI工程师每日资讯精选",
  description: "How over 80k top AI Engineers keep up with AI news, every weekday. We summarize top AI discords, reddits, and X/Twitter. 超过8万顶尖AI工程师每个工作日获取AI新闻的方式。",
  keywords: "AI news, artificial intelligence, AI newsletter, AI engineers, machine learning, deep learning, AI资讯, 人工智能, AI工程师",
  authors: [{ name: "SnapAllx.ai" }],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    alternateLocale: "en_US",
    title: "AINews - Daily AI Roundup for Engineers",
    description: "How over 80k top AI Engineers keep up with AI news, every weekday.",
    siteName: "AINews",
    images: [
      {
        url: "",
        width: 1200,
        height: 630,
        alt: "AINews - Daily AI Roundup for Engineers",
      },
    ],
  },
  alternates: {
    canonical: "https://ai.snapallx.com/",
    languages: {
      "en": "https://ai.snapallx.com/?lang=en",
      "zh-CN": "https://ai.snapallx.com/",
    },
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
