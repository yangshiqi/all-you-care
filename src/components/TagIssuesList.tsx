"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { getAllAiContents, IssueSummary, extractTagsFromContent } from "@/lib/api";
import { TranslatedText } from "./TranslatedText";

interface TagIssuesListProps {
  tag: string
}

export const TagIssuesList = ({ tag }: TagIssuesListProps) => {
  const { t, i18n } = useTranslation();
  const [issues, setIssues] = useState<IssueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllAiContents(i18n.language);
        const formatted: IssueSummary[] = data.map(item => ({
          id: item.id,
          title: item.title,
          summary: item.summary,
          date: new Date(item.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          tags: extractTagsFromContent(item.tags)
        }));
        setIssues(formatted);
      } catch (err) {
        console.error('Error fetching issues:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch issues');
        setIssues([]);
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, [i18n.language]);

  const filtered = useMemo(() => {
    const needle = tag.toLowerCase();
    return issues.filter(issue => issue.tags.some(t => t.toLowerCase().includes(needle)));
  }, [issues, tag]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4 vintage-border bg-card px-8 py-4 inline-block">
            <TranslatedText>Tag: {tag}</TranslatedText>
          </h1>
          <p className="text-lg text-muted-foreground">
            <TranslatedText>{t('issuesList.description')}</TranslatedText>
          </p>
        </header>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">
                <TranslatedText>{t('common.loading')}</TranslatedText>
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">
                <TranslatedText>{t('common.error')}: {error}</TranslatedText>
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                <TranslatedText>{t('issuesList.noResults')}</TranslatedText>
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/issues">
                  <TranslatedText>{t('issuesList.backToHome')}</TranslatedText>
                </Link>
              </Button>
            </div>
          ) : (
            filtered.map(issue => (
              <article key={issue.id} className="bg-card vintage-border p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-primary mb-2">
                      <Link href={`/issues/${issue.id}`} className="hover:text-primary/80 transition-colors">
                        {issue.title}
                      </Link>
                    </h2>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider monospace">
                      {issue.date}
                    </p>
                  </div>
                </div>
                <p className="text-foreground mb-4 leading-relaxed">{issue.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {issue.tags.map((t) => (
                    <Link
                      key={`${issue.id}-${t}`}
                      href={`/tags/${encodeURIComponent(t)}`}
                      className="px-3 py-1 text-xs bg-secondary border-2 border-border hover:border-primary hover:text-primary transition-all uppercase tracking-wider"
                    >
                      {t}
                    </Link>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>

        <div className="text-center mt-12">
          <Button asChild className="vintage-border bg-primary text-primary-foreground px-8 py-3 font-bold uppercase tracking-wider hover:bg-primary/90">
            <Link href="/issues">
              <TranslatedText>{t('issuesList.backToHome')}</TranslatedText>
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}


