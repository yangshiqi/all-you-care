import { Metadata } from "next";
import { Header } from "@/components/Header";
import { IssuesList } from "@/components/IssuesList";

export const metadata: Metadata = {
  title: "All Issues | AINews - Daily AI Roundup for Engineers",
  description: "Browse all AI news issues and stay up to date with the latest developments in artificial intelligence.",
  openGraph: {
    title: "All Issues | AINews",
    description: "Browse all AI news issues and stay up to date with the latest developments in artificial intelligence.",
    type: "website",
  },
};

export default function IssuesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <IssuesList />
    </div>
  );
}
