"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { getAllAiContents, IssueSummary, extractTagsFromContent } from "@/lib/api";
import { TranslatedText } from "./TranslatedText";

export const IssuesList = () => {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState("");
  const [issues, setIssues] = useState<IssueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 从 Supabase 获取数据
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllAiContents(i18n.language);
        
        // 转换为 IssueSummary 格式
        const formattedIssues: IssueSummary[] = data.map(item => ({
          id: item.id,
          title: item.title,
          summary: item.summary,
          date: new Date(item.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          tags: extractTagsFromContent(item.tags) // 使用 tags 字段而不是 summary
        }));
        
        setIssues(formattedIssues);
      } catch (err) {
        console.error('Error fetching issues:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch issues');
        // 如果 Supabase 连接失败，使用备用数据
        setIssues([
          {
            id: "fallback-1",
            title: "AI breakthroughs in multimodal learning",
            date: "Dec 19, 2024",
            summary: "Major advances in vision-language models and their applications",
            tags: ["multimodal", "vision", "language", "breakthrough"]
          },
          {
            id: "fallback-2",
            title: "New open source models released",
            date: "Dec 17, 2024",
            summary: "Several organizations released new open source AI models",
            tags: ["open-source", "models", "release"]
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);


  const filteredIssues = issues.filter(issue => 
    issue.title.toLowerCase().includes(filter.toLowerCase()) ||
    issue.summary.toLowerCase().includes(filter.toLowerCase()) ||
    issue.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4 vintage-border bg-card px-8 py-4 inline-block">
            <TranslatedText>{t('issuesList.title')}</TranslatedText>
          </h1>
          <p className="text-lg text-muted-foreground">
            <TranslatedText>{t('issuesList.description')}</TranslatedText>
          </p>
        </div>

        {/*<div className="mb-8">
          <label htmlFor="filter" className="block text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            <TranslatedText>{t('issuesList.filterLabel')}</TranslatedText>
          </label>
          <Input
            id="filter"
            type="text"
            placeholder={t('issuesList.filterPlaceholder')}
            value={filter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
            className="bg-background border-2 border-border"
            suppressHydrationWarning
          />
        </div>*/}

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
              <p className="text-muted-foreground text-sm">
                <TranslatedText>{t('issuesList.fallbackMessage')}</TranslatedText>
              </p>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                <TranslatedText>{t('issuesList.noResults')}</TranslatedText>
              </p>
              <Button 
                onClick={() => setFilter("")}
                className="mt-4"
                variant="outline"
              >
                <TranslatedText>{t('issuesList.clearFilters')}</TranslatedText>
              </Button>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <article key={issue.id} className="bg-card vintage-border p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-primary mb-2">
                      <Link 
                        href={`/issues/${issue.id}`}
                        className="hover:text-primary/80 transition-colors"
                      >
                        {issue.title}
                      </Link>
                    </h2>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider monospace">
                      {issue.date}
                    </p>
                  </div>
                </div>
                
                <p className="text-foreground mb-4 leading-relaxed">
                  {issue.summary}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {issue.tags.map((tag: string) => (
                    <Link
                      key={tag}
                      href={`/tags/${encodeURIComponent(tag)}`}
                      className="px-3 py-1 text-xs bg-secondary border-2 border-border hover:border-primary hover:text-primary transition-all uppercase tracking-wider"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>


        <div className="text-center mt-12">
          <Button asChild className="vintage-border bg-primary text-primary-foreground px-8 py-3 font-bold uppercase tracking-wider hover:bg-primary/90">
            <Link href="/">
              <TranslatedText>{t('issuesList.backToHome')}</TranslatedText>
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
};
