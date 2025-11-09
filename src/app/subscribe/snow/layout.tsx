import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All you care [SNOW] news - 订阅 SNOW 新闻",
  description: "订阅 SNOW 新闻，获取最新的雪地运动资讯。注意:一旦订阅成功,请尽量控制自己的钱包不要破产。",
  openGraph: {
    title: "All you care [SNOW] news - 订阅 SNOW 新闻",
    description: "订阅 SNOW 新闻，获取最新的雪地运动资讯。",
    type: "website",
    locale: "zh_CN",
    alternateLocale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "All you care [SNOW] news - 订阅 SNOW 新闻",
    description: "订阅 SNOW 新闻，获取最新的雪地运动资讯。",
  },
};

export default function SnowSubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

