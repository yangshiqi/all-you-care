import { Metadata } from "next";
import { Header } from "@/components/Header";
import { TagsList } from "@/components/TagsList";

export const metadata: Metadata = {
  title: "All Tags | AINews - Daily AI Roundup for Engineers",
  description: "Browse all tags and explore AI news issues by topics.",
  openGraph: {
    title: "All Tags | AINews",
    description: "Browse all tags and explore AI news issues by topics.",
    type: "website",
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

