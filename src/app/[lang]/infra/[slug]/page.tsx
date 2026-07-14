import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { getInfraContentByJournalId, getAllInfraContentIds } from "@/lib/api";
import { isValidLanguage } from "@/lib/i18n-utils";
import { extractBodyContent, stripDuplicateHeader } from "@/lib/issueHtml";
import "../infra-report.css";

interface Props {
  params: Promise<{ slug: string; lang: string }>;
}

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  const contents = await getAllInfraContentIds(params.lang);
  const slugs = Array.from(
    new Set(contents.map((i) => i.journal_id || i.id).filter(Boolean)),
  );
  return slugs.map((slug) => ({ slug: String(slug) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lang } = await params;
  const issue = await getInfraContentByJournalId(slug, lang);
  if (!issue) return { title: "Not Found" };

  // 分享预览读的是 Open Graph / Twitter 标签；若只设 title/description，
  // 会继承 [lang]/layout.tsx 里那套通用站点 OG，导致分享出的是站点介绍而非本篇标题。
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.snapallx.com";
  const imgUrl = issue.imgUrl || "/x_welcome.jpg";
  const ogImageUrl = imgUrl.startsWith("http")
    ? imgUrl
    : `${baseUrl}${imgUrl.startsWith("/") ? "" : "/"}${imgUrl}`;
  const pageUrl = `${baseUrl}/${lang}/infra/${slug}`;

  return {
    title: issue.title,
    description: issue.summary,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: issue.title,
      description: issue.summary,
      type: "article",
      publishedTime: issue.created_at,
      url: pageUrl,
      siteName: "[AI]News",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: issue.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: issue.title,
      description: issue.summary,
      images: [ogImageUrl],
    },
  };
}

export default async function InfraDetailPage({ params }: Props) {
  const { slug, lang } = await params;
  if (!isValidLanguage(lang)) notFound();
  const issue = await getInfraContentByJournalId(slug, lang);
  if (!issue) notFound();

  const date = issue.created_at ? new Date(issue.created_at).toLocaleDateString("zh-CN") : "";
  const bodyHtml = stripDuplicateHeader(extractBodyContent(issue.content));

  return (
    <div className="min-h-screen bg-background">
      <Header initialLang={lang as "en" | "zh-CN"} />
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          <header className="mb-8 text-center">
            <div className="text-sm text-muted-foreground uppercase tracking-widest mb-2">{date}</div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{issue.title}</h1>
          </header>
          <div className="infra-content" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        </article>
      </main>
    </div>
  );
}
