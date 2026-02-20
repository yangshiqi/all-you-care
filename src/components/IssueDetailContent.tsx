"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronDown, ChevronUp, ArrowRight, Terminal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TranslatedText } from "./TranslatedText";
import { useCurrentLanguage } from "@/hooks/use-current-language";
import { addLanguageToPath } from "@/lib/i18n-utils";

// Interface for SnapAI Insight (Zack's Take)
interface RelatedInsight {
  slug: string;
  title: string;
  excerpt: string | null;
}

interface IssueData {
  title: string;
  date: string;
  summary: string;
  imgUrl: string;
  tagCategories: {
    title: string;
    tags: string[];
  }[];
  sections: {
    id: string;
    title: string;
    content: string;
  }[];
}

interface IssueDetailContentProps {
  issue: IssueData;
  issueId: string;
  hasEnVersion: boolean;
  initialLang?: string;
  relatedInsight?: RelatedInsight | null; // New prop for related insight
}

export const IssueDetailContent = ({ issue, issueId, hasEnVersion, initialLang, relatedInsight }: IssueDetailContentProps) => {
  const { t, i18n } = useTranslation();
  const lang = useCurrentLanguage();
  const [showTags, setShowTags] = useState(true);
  
  useEffect(() => {
    if (initialLang && i18n.language !== initialLang) {
      i18n.changeLanguage(initialLang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLang]);

  useEffect(() => {
    // ... (Existing hreflang logic remains unchanged)
    if (typeof window === 'undefined' || !hasEnVersion) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snapallx.com';
      const linkId = `hreflang-issue-${issueId}`;
      const removeLinks = (selector: string) => {
          document.querySelectorAll(selector).forEach(link => link.parentNode?.removeChild(link));
      };
      removeLinks(`link[rel="alternate"][hreflang="en"][data-issue-id="${issueId}"]`);
      removeLinks(`link[rel="alternate"][hreflang="zh-CN"][data-issue-id="${issueId}"]`);
      
      const createLink = (lang: string, href: string, idSuffix: string) => {
          const link = document.createElement('link');
          link.rel = 'alternate';
          link.hreflang = lang;
          link.href = href;
          link.setAttribute('data-issue-id', issueId);
          link.id = `${linkId}-${idSuffix}`;
          document.head.appendChild(link);
      };

      createLink('en', `${baseUrl}/en/issues/${issueId}`, 'en');
      createLink('zh-CN', `${baseUrl}/zh-CN/issues/${issueId}`, 'zh');

      return () => {
        const removeById = (id: string) => document.getElementById(id)?.remove();
        removeById(`${linkId}-en`);
        removeById(`${linkId}-zh`);
      };
    } catch (error) {
      console.error('Error setting up hreflang links:', error);
    }
  }, [issueId, hasEnVersion]);

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-dotted border-border">
        <Link 
          href={addLanguageToPath("/issues", lang)} 
          className="inline-flex items-center gap-2 text-sm hover:text-primary transition-colors uppercase tracking-wider font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          <TranslatedText>{t('issueDetail.backToIssues')}</TranslatedText>
        </Link>
        <button 
          className="text-sm text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider" 
          onClick={() => document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <TranslatedText>{t('issueDetail.skipToMain')} ↓</TranslatedText>
        </button>
      </div>

      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-block vintage-border1 bg-card px-8 py-6 mb-4">
          <div className="text-sm text-muted-foreground uppercase tracking-widest monospace mb-2">
            {issue.date}
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4">
            {issue.title}
          </h1>
        </div>
        
        {/* ZACK'S TAKE (Insight Card) */}
        {relatedInsight && (
          <div className="max-w-4xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Link 
              href={addLanguageToPath(`/blog/${relatedInsight.slug}`, lang)}
              className="block group relative overflow-hidden rounded-xl border-4 border-black bg-white dark:bg-zinc-900 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              <div className="absolute top-0 right-0 bg-black text-white px-3 py-1 font-mono text-xs font-bold uppercase dark:bg-white dark:text-black">
                Editor's Take
              </div>
              <div className="flex items-start gap-4">
                <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black shrink-0">
                  <Terminal className="h-6 w-6" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-bold font-serif mb-2 group-hover:text-primary transition-colors">
                    {relatedInsight.title}
                  </h3>
                  {relatedInsight.excerpt && (
                    <p className="text-muted-foreground line-clamp-2 font-serif italic mb-3">
                      "{relatedInsight.excerpt}"
                    </p>
                  )}
                  <span className="inline-flex items-center text-sm font-bold uppercase tracking-wider text-primary group-hover:gap-2 transition-all">
                    Read Full Analysis <ArrowRight className="ml-1 w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Tags Section */}
        <div className="max-w-4xl mx-auto mt-8">
          <button 
            onClick={() => setShowTags(!showTags)} 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider mx-auto mb-4"
          >
            {showTags ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <TranslatedText>
              {showTags ? t('issueDetail.hideTags') : t('issueDetail.showTags')}
            </TranslatedText>
          </button>
          
          {showTags && (
            <div className="vintage-border bg-card p-6 space-y-6 text-left">
              {issue.tagCategories.map((category, index) => (
                <div key={index}>
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2 monospace font-bold">
                    {category.title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {category.tags.map((tag, tagIndex) => (
                      <Link 
                        key={tagIndex} 
                        href={addLanguageToPath(`/tags/${encodeURIComponent(tag)}`, lang)} 
                        className="px-3 py-1 text-sm bg-secondary border-2 border-border hover:border-primary hover:text-primary transition-all uppercase tracking-wider"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Intro Section */}
                <div className="pt-4 border-t border-border">
                  <p className="text-muted-foreground italic leading-relaxed" suppressHydrationWarning>
                    <TranslatedText>
                      {t('issueDetail.intro', { date: issue.date })}
                    </TranslatedText>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8 max-w-4xl mx-auto">
        <article id="main-content" className="flex-1 paper-texture">
          {issue.imgUrl && (
            <div className="mb-8 p-1 vintage-border1 bg-card">
              <img 
                src={issue.imgUrl} 
                alt={issue.title} 
                className="w-full h-auto object-cover rounded-md"
              />
            </div>
          )}
          
          <div className="space-y-12">
            {issue.sections.map(section => (
              <section key={section.id} id={section.id} className="scroll-mt-4">
                <div className="vintage-border1 bg-card p-1">
                  <div className="flex items-center gap-4 mb-6 pb-4 border-b-4 border-primary">
                    <div className="w-2 h-2 bg-primary" />
                    <h2 className="text-3xl font-bold text-primary uppercase tracking-wider">
                      {section.title}
                    </h2>
                    <div className="w-2 h-2 bg-primary" />
                  </div>
                  <div 
                    className="prose prose-vintage max-w-none" 
                    dangerouslySetInnerHTML={{ __html: section.content }}
                    style={{ lineHeight: '1.8' }}
                  />
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>

      {/* Back to Top */}
      <div className="text-center mt-12 pt-8 border-t-4 border-primary">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          className="vintage-border bg-primary text-primary-foreground px-8 py-3 font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
        >
          ↑ <TranslatedText>{t('issueDetail.backToTop')}</TranslatedText>
        </button>
      </div>
    </main>
  );
};
