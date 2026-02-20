// src/components/EditorsShowcase.tsx
"use client";

import Link from 'next/link';
import { AuthorAvatar } from '@/components/AuthorAvatar';
import { useTranslation } from 'react-i18next';
import { TranslatedText } from './TranslatedText';

const EDITOR_IDS = ['zack', 'tom', 'brad', 'tim'];

export function EditorsShowcase({ lang = 'zh-CN' }: { lang?: string }) {
  const { t } = useTranslation();

  return (
    <section className="py-16 border-t-4 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black font-serif mb-4 tracking-tighter uppercase">
            <TranslatedText>{t('editors.title')}</TranslatedText>
          </h2>
          <div className="w-24 h-1 bg-black dark:bg-white mx-auto mb-6"></div>
          <p className="text-lg md:text-xl font-serif italic max-w-2xl mx-auto">
            &quot;<TranslatedText>{t('editors.subtitle')}</TranslatedText>&quot;
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-black dark:border-white">
          {EDITOR_IDS.map((editorId, index) => (
            <Link 
              key={editorId} 
              href={`/${lang}/blog?author=${editorId.charAt(0).toUpperCase() + editorId.slice(1)}`}
              className={`group relative p-8 flex flex-col items-center text-center border-black dark:border-white transition-colors duration-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black
                ${index !== 0 && index !== 4 ? 'border-t-2 md:border-t-0' : ''}
                ${index % 2 !== 0 ? 'md:border-l-2' : ''}
                ${index >= 2 ? 'lg:border-t-0' : ''}
                ${index !== 0 ? 'lg:border-l-2' : ''}
                /* Reset borders for simpler grid lines logic: just simpler brute force */
                border-b-2 lg:border-b-0 last:border-b-0 lg:border-r-2 lg:last:border-r-0
              `}
              style={{ outline: '1px solid currentColor' }}
            >
              <div className="mb-6 transform group-hover:scale-105 transition-transform duration-300 filter grayscale group-hover:grayscale-0 w-full flex justify-center">
                <AuthorAvatar author={editorId} size="xxl" />
              </div>
              
              <h3 className="text-2xl font-bold font-serif mb-2 uppercase tracking-wide">
                {editorId}
              </h3>
              
              <div className="text-[10px] font-bold uppercase tracking-widest mb-4 font-mono border border-black dark:border-white px-2 py-1 group-hover:border-white dark:group-hover:border-black group-hover:bg-white group-hover:text-black dark:group-hover:bg-black dark:group-hover:text-white transition-colors">
                <TranslatedText>{t(`editors.${editorId}.role`)}</TranslatedText>
              </div>
              
              <p className="text-sm leading-relaxed font-serif opacity-80 group-hover:opacity-100">
                <TranslatedText>{t(`editors.${editorId}.description`)}</TranslatedText>
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
