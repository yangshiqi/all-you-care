import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { RecentIssues } from "@/components/RecentIssues";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AINews - Break Your Information Bubble | 打破信息茧房，获取行业资讯",
  description: "打破每个人的信息茧房，收集行业内的新闻，帮助大家压缩信息、节省时间、缓解焦虑。We break information bubbles by collecting industry news to help everyone compress information, save time, and reduce anxiety.",
  openGraph: {
    title: "AINews - Break Your Information Bubble",
    description: "We break information bubbles by collecting industry news to help everyone compress information, save time, and reduce anxiety.",
    type: "website",
    locale: "en_US",
    alternateLocale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "AINews - Break Your Information Bubble",
    description: "We break information bubbles by collecting industry news to help everyone compress information, save time, and reduce anxiety.",
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
