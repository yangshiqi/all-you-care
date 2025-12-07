"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TranslatedText } from "./TranslatedText";
import { useCurrentLanguage } from "@/hooks/use-current-language";
import { addLanguageToPath } from "@/lib/i18n-utils";

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
  initialLang?: string; // 从服务器端传递的语言
}

export const IssueDetailContent = ({ issue, issueId, hasEnVersion, initialLang }: IssueDetailContentProps) => {
  const { t, i18n } = useTranslation();
  const lang = useCurrentLanguage();
  const [showTags, setShowTags] = useState(true);
  
  // 同步服务器端语言到客户端 i18n，避免 hydration 不匹配
  useEffect(() => {
    if (initialLang && i18n.language !== initialLang) {
      i18n.changeLanguage(initialLang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLang]);

  // 添加 hreflang 标签到 head
  useEffect(() => {
    // 确保在浏览器环境中执行
    if (typeof window === 'undefined' || !hasEnVersion) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snapallx.com';
      
      // 使用特定的标识符来识别我们创建的标签，避免误删其他标签
      const linkId = `hreflang-issue-${issueId}`;
      
      // 移除可能已存在的相同 hreflang 标签（避免重复）
      // 只移除我们之前创建的标签
      try {
        const existingEnLinks = document.querySelectorAll(`link[rel="alternate"][hreflang="en"][data-issue-id="${issueId}"]`);
        existingEnLinks.forEach(link => {
          if (link && link.parentNode) {
            link.remove();
          }
        });
      } catch (error) {
        console.warn('Error removing existing en links:', error);
      }
      
      try {
        const existingZhLinks = document.querySelectorAll(`link[rel="alternate"][hreflang="zh-CN"][data-issue-id="${issueId}"]`);
        existingZhLinks.forEach(link => {
          if (link && link.parentNode) {
            link.remove();
          }
        });
      } catch (error) {
        console.warn('Error removing existing zh-CN links:', error);
      }
      
      // 创建 en 版本的 link 标签
      const enLink = document.createElement('link');
      enLink.setAttribute('rel', 'alternate');
      enLink.setAttribute('hreflang', 'en');
      enLink.setAttribute('href', `${baseUrl}/en/issues/${issueId}`);
      enLink.setAttribute('data-issue-id', issueId);
      enLink.setAttribute('id', `${linkId}-en`);
      
      // 创建 zh-CN 版本的 link 标签
      const zhLink = document.createElement('link');
      zhLink.setAttribute('rel', 'alternate');
      zhLink.setAttribute('hreflang', 'zh-CN');
      zhLink.setAttribute('href', `${baseUrl}/zh-CN/issues/${issueId}`);
      zhLink.setAttribute('data-issue-id', issueId);
      zhLink.setAttribute('id', `${linkId}-zh`);
      
      // 确保 head 存在后再添加
      if (document.head) {
        document.head.appendChild(enLink);
        document.head.appendChild(zhLink);
      }

      // 清理函数：组件卸载时移除这些标签
      return () => {
        try {
          // 使用 ID 来精确查找和移除，避免误删
          const enLinkToRemove = document.getElementById(`${linkId}-en`);
          const zhLinkToRemove = document.getElementById(`${linkId}-zh`);
          
          if (enLinkToRemove && enLinkToRemove.parentNode) {
            enLinkToRemove.remove();
          }
          if (zhLinkToRemove && zhLinkToRemove.parentNode) {
            zhLinkToRemove.remove();
          }
        } catch (error) {
          console.warn('Error removing hreflang links:', error);
        }
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
                  {issue.imgUrl && <img src={issue.imgUrl} alt="Cover Image" className="hero-img"/>}
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
