import { Header } from "@/components/Header";
import { getWeeklyIssues } from "@/lib/api";
import { isValidLanguage } from "@/lib/i18n-utils";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function WeeklyPage({ params }: Props) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) notFound();

  const issues = await getWeeklyIssues(lang, 50);

  return (
    <div className="min-h-screen bg-background">
      <Header initialLang={lang} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">{lang === 'en' ? 'AI Weekly' : 'AI 周报'}</h1>
          <p className="text-muted-foreground mb-8">{lang === 'en' ? 'Weekly Picks · Trend Insights · Action Items' : '每周精选 · 趋势洞察 · 行动建议'}</p>
          {issues.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">{lang === 'en' ? 'No weekly issues yet, stay tuned.' : '暂无周报，敬请期待。'}</p>
          ) : (
            <div className="space-y-4">
              {issues.map(issue => (
                <Link
                  key={issue.id}
                  href={`/${lang}/issues/${issue.journal_id}`}
                  className="block p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <h2 className="text-lg font-semibold">{issue.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{issue.summary}</p>
                  <p className="text-xs text-muted-foreground mt-2">{issue.date}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
