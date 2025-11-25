import { Metadata } from "next";
import { Header } from "@/components/Header";
import { TagsList } from "@/components/TagsList";
import { getAbsoluteUrl } from "@/lib/utils";

const ogImageUrl = getAbsoluteUrl("/x_welcome.jpg");

export const metadata: Metadata = {
  title: "All Tags | AINews - Daily AI Roundup for Engineers",
  description: "Browse all tags and explore AI news issues by topics.",
  openGraph: {
    title: "All Tags | AINews",
    description: "Browse all tags and explore AI news issues by topics.",
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "All Tags | AINews",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "All Tags | AINews",
    description: "Browse all tags and explore AI news issues by topics.",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "All Tags | AINews",
      },
    ],
  },
};

export default function TagsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TagsList />
    </div>
  );
}

