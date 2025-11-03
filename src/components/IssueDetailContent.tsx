"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TranslatedText } from "./TranslatedText";

interface IssueData {
  title: string;
  date: string;
  summary: string;
  intro: string;
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
}

export const IssueDetailContent = ({ issue }: IssueDetailContentProps) => {
  const { t } = useTranslation();
  const [showTags, setShowTags] = useState(true);

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-dotted border-border">
        <Link 
          href="/issues" 
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
                        href={`/tags/${encodeURIComponent(tag)}`} 
                        className="px-3 py-1 text-sm bg-secondary border-2 border-border hover:border-primary hover:text-primary transition-all uppercase tracking-wider"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Summary Section */}
              {issue.summary && (
                <div className="pt-4 border-t border-border">
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 monospace font-bold">
                    <TranslatedText>{t('issueDetail.summary')}</TranslatedText>
                  </h3>
                  <p className="text-muted-foreground italic leading-relaxed">
                    {issue.summary}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Intro Quote */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="vintage-border bg-secondary/30 p-6 border-l-8 border-l-primary">
          <p className="text-foreground leading-relaxed">
            {issue.intro}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8 max-w-4xl mx-auto">
        {/* Main Content */}
        <article id="main-content" className="flex-1 paper-texture">
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
