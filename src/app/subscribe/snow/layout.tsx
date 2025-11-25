import { Metadata } from "next";
import { getAbsoluteUrl } from "@/lib/utils";

const ogImageUrl = getAbsoluteUrl("/welcome.jpg");

export const metadata: Metadata = {
  title: "All you care [SNOW] news - 订阅 SNOW 新闻",
  description: "订阅 SNOW 新闻，获取最新的雪地运动资讯。注意:一旦订阅成功,请尽量控制自己的钱包不要破产。",
  openGraph: {
    title: "All you care [SNOW] news - 订阅 SNOW 新闻",
    description: "订阅 SNOW 新闻，获取最新的雪地运动资讯。",
    type: "website",
    locale: "zh_CN",
    alternateLocale: "en_US",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "All you care [SNOW] news - 订阅 SNOW 新闻",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "All you care [SNOW] news - 订阅 SNOW 新闻",
    description: "订阅 SNOW 新闻，获取最新的雪地运动资讯。",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "All you care [SNOW] news - 订阅 SNOW 新闻",
      },
    ],
  },
};

export default function SnowSubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}




