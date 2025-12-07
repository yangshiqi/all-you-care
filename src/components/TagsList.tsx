"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { getAllTags } from "@/lib/api";
import { TranslatedText } from "./TranslatedText";
import { useCurrentLanguage } from "@/hooks/use-current-language";
import { addLanguageToPath } from "@/lib/i18n-utils";

interface TagInfo {
  name: string;
  count: number;
}

export const TagsList = () => {
  const { t, i18n } = useTranslation();
  const lang = useCurrentLanguage();
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllTags(i18n.language);
        const tagsArray: TagInfo[] = data.map(row => ({ name: row.name, count: row.total }));
        setTags(tagsArray);
      } catch (err) {
        console.error('Error fetching tags:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tags');
        setTags([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTags();
  }, [i18n.language]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4 vintage-border bg-card px-8 py-4 inline-block">
            <TranslatedText>{t('tagsList.title')}</TranslatedText>
          </h1>
          <p className="text-lg text-muted-foreground">
            <TranslatedText>{t('tagsList.description')}</TranslatedText>
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
          ) : tags.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                <TranslatedText>No tags found</TranslatedText>
              </p>
            </div>
          ) : (
            <div className="vintage-border bg-card p-8">
              <div className="flex flex-wrap gap-3">
                {tags.map((tagInfo) => (
                  <Link
                    key={tagInfo.name}
                    href={addLanguageToPath(`/tags/${encodeURIComponent(tagInfo.name)}`, lang)}
                    className="group px-4 py-2 bg-secondary border-2 border-border hover:border-primary hover:text-primary transition-all uppercase tracking-wider font-medium relative"
                  >
                    <span>{tagInfo.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground group-hover:text-primary">
                      ({tagInfo.count})
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <Link 
            href={addLanguageToPath("/issues", lang)}
            className="inline-block vintage-border bg-primary text-primary-foreground px-8 py-3 font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
          >
            <TranslatedText>{t('tagsList.backToIssues')}</TranslatedText>
          </Link>
        </div>
      </div>
    </main>
  );
}

