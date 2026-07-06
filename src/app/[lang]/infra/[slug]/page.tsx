import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { getInfraContentByJournalId, getAllInfraContentIds } from "@/lib/api";
import { isValidLanguage } from "@/lib/i18n-utils";
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
  return { title: issue.title, description: issue.summary };
}

export default async function InfraDetailPage({ params }: Props) {
  const { slug, lang } = await params;
  if (!isValidLanguage(lang)) notFound();
  const issue = await getInfraContentByJournalId(slug, lang);
  if (!issue) notFound();

  const date = issue.created_at ? new Date(issue.created_at).toLocaleDateString("zh-CN") : "";

  return (
    <div className="min-h-screen bg-background">
      <Header initialLang={lang as "en" | "zh-CN"} />
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          <header className="mb-8 text-center">
            <div className="text-sm text-muted-foreground uppercase tracking-widest mb-2">{date}</div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{issue.title}</h1>
          </header>
          <div className="infra-content" dangerouslySetInnerHTML={{ __html: issue.content }} />
        </article>
      </main>
    </div>
  );
}
