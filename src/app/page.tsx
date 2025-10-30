import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { RecentIssues } from "@/components/RecentIssues";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AINews - Daily AI Roundup for Engineers | AI工程师每日资讯精选",
  description: "How over 80k top AI Engineers keep up with AI news, every weekday. We summarize top AI discords, reddits, and X/Twitter. 超过8万顶尖AI工程师每个工作日获取AI新闻的方式。",
  openGraph: {
    title: "AINews - Daily AI Roundup for Engineers",
    description: "How over 80k top AI Engineers keep up with AI news, every weekday.",
    type: "website",
    locale: "en_US",
    alternateLocale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "AINews - Daily AI Roundup for Engineers",
    description: "How over 80k top AI Engineers keep up with AI news, every weekday.",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <RecentIssues />
      </main>
    </div>
  );
}
