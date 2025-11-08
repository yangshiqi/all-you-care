import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { RecentIssues } from "@/components/RecentIssues";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "[AI]News - 打破信息茧房，获取行业资讯",
  description: "打破每个人的信息茧房，收集行业内的新闻，帮助大家压缩信息、节省时间、缓解焦虑。我们汇总 AI Discord、Reddit、X/Twitter、HackerNews、InfoQ、TechCrunch、CNCF、NVIDIA、Meta、OpenAI、Google、Microsoft、Amazon、Apple等平台的内容，定时为您发送精选资讯！",
  openGraph: {
    title: "[AI]News - 打破信息茧房，获取行业资讯",
    description: "打破每个人的信息茧房，收集行业内的新闻，帮助大家压缩信息、节省时间、缓解焦虑。",
    type: "website",
    locale: "zh_CN",
    alternateLocale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "[AI]News - 打破信息茧房，获取行业资讯",
    description: "打破每个人的信息茧房，收集行业内的新闻，帮助大家压缩信息、节省时间、缓解焦虑。",
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
