"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IssueSummary, getAllAiContentsPaginated } from "@/lib/api";
import { TranslatedText } from "./TranslatedText";
import { Pagination } from "./Pagination";

interface IssuesListProps {
  initialIssues: IssueSummary[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  initialTotalPages: number;
}

export const IssuesList = ({
  initialIssues,
  initialTotal,
  initialPage,
  initialPageSize,
  initialTotalPages
}: IssuesListProps) => {
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState("");
  const [issues, setIssues] = useState<IssueSummary[]>(initialIssues);
  const [total, setTotal] = useState(initialTotal);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);
  const [currentLang, setCurrentLang] = useState<string>('en'); // 追踪当前语言
  const [isInitialLoad, setIsInitialLoad] = useState(true); // 标记是否为初始加载

  // 加载指定页的数据
  const loadPageData = useCallback(async (page: number, lang?: string) => {
    try {
      setLoading(true);
      const langToUse = lang || i18n.language;
      const result = await getAllAiContentsPaginated(page, pageSize, langToUse);
      setIssues(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setCurrentPage(result.page);
      setCurrentLang(langToUse);
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error loading page data:', error);
    } finally {
      setLoading(false);
    }
  }, [i18n.language, pageSize]);

  // 组件挂载时，根据当前语言加载数据
  useEffect(() => {
    // 初始加载时，或者语言变化时，重新加载数据
    if (isInitialLoad || i18n.language !== currentLang) {
      const pageParam = searchParams.get('page');
      const page = pageParam ? parseInt(pageParam, 10) : 1;
      loadPageData(page, i18n.language);
    }
  }, [i18n.language, currentLang, searchParams, loadPageData, isInitialLoad]);

  // 从 URL 读取页码参数（仅当语言已确定后）
  useEffect(() => {
    if (isInitialLoad) return; // 等待初始语言加载完成
    
    const pageParam = searchParams.get('page');
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    
    // 如果 URL 中的页码与当前状态不同，需要加载数据
    if (page !== currentPage && page >= 1) {
      loadPageData(page);
    }
  }, [searchParams, currentPage, loadPageData, isInitialLoad]);


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

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">
              <TranslatedText>{t('common.loading')}</TranslatedText>
            </p>
          </div>
        )}

        <div className="space-y-6">
          {!loading && filteredIssues.length === 0 ? (
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

        {/* 分页组件 */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={total}
            pageSize={pageSize}
            baseUrl="/issues"
          />
        )}


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
