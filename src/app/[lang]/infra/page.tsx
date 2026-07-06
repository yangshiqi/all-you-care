import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { getInfraContentsPaginated } from "@/lib/api";
import { isValidLanguage, addLanguageToPath } from "@/lib/i18n-utils";
import { en } from "@/lib/locales/en";
import { zh_CN } from "@/lib/locales/zh_CN";

const translations = { en: en.translation, "zh-CN": zh_CN.translation };

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLanguage(lang)) return { title: "AI 原生周报" };
  const t = translations[lang as "en" | "zh-CN"];
  return { title: t.metadata.infra.title, description: t.metadata.infra.description };
}

export default async function InfraPage({ params }: Props) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) notFound();

  let result;
  try {
    result = await getInfraContentsPaginated(1, 20, lang);
  } catch (error) {
    console.error("Error fetching infra list:", error);
    result = { data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
  }
  const t = translations[lang as "en" | "zh-CN"];

  return (
    <div className="min-h-screen bg-background">
      <Header initialLang={lang as "en" | "zh-CN"} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8 text-center">
            {t.metadata.infra.title}
          </h1>
          {result.data.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">{t.metadata.infra.empty}</p>
          ) : (
            <ul className="space-y-6">
              {result.data.map((issue) => (
                <li key={issue.id} className="vintage-border1 bg-card p-6">
                  <Link
                    href={addLanguageToPath(`/infra/${issue.journal_id}`, lang as "en" | "zh-CN")}
                    className="block group"
                  >
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                      {issue.date}
                    </div>
                    <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {issue.title}
                    </h2>
                    {issue.summary && (
                      <p className="mt-2 text-muted-foreground line-clamp-3">{issue.summary}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
