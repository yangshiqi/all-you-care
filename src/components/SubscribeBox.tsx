"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TranslatedText } from "./TranslatedText";

interface SubscribeBoxProps {
  className?: string;
  /** 是否显示卡片头部（标题 + 订阅人数 + 副文案）。落地页已有大标题，可关掉以免重复。默认 true。 */
  showHeader?: boolean;
}

/**
 * 可复用的邮件订阅卡片：渐变背景 + 标题栏（含订阅人数徽章）+ Brevo 表单 + 隐私提示。
 * 首页 Hero 与独立订阅落地页共用同一组件，沿用 hero.* i18n key。
 * 表单直接 POST 到 Brevo（AI 频道）表单端点，由 Brevo 发确认邮件并跳转 success 页。
 */
export const SubscribeBox = ({ className, showHeader = true }: SubscribeBoxProps = {}) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t, i18n } = useTranslation();

  const handleSubmit = () => {
    setIsSubmitting(true);
  };

  return (
    <div className={`relative ${className ?? ""}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 rounded-2xl blur-xl"></div>

      <div className="relative bg-card rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-zinc-800">
        {/* 顶部标题栏（落地页可隐藏，避免与大标题重复） */}
        {showHeader && (
          <div className="bg-transparent px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 7L10.8 13.6C11.5111 14.1333 12.4889 14.1333 13.2 13.6L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                </div>
                <h3 className="font-bold text-lg tracking-wide">
                  <TranslatedText>{t('hero.subscribeBoxTitle')}</TranslatedText>
                </h3>
              </div>
              <div className="text-sm text-right">
                <span className="font-bold text-foreground block md:inline">
                  <TranslatedText>{t('hero.subscriberCount')}</TranslatedText>
                </span>
                <span className="text-muted-foreground ml-1 text-xs md:text-sm">
                  <TranslatedText>{t('hero.subscriberLabel')}</TranslatedText>
                </span>
              </div>
            </div>
            <div>
              <p className="text-md opacity-80 leading-relaxed">
                <TranslatedText>{t('hero.subscribeBoxSubtitle')}</TranslatedText>
              </p>
            </div>
          </div>
        )}

        {/* 表单区域 */}
        <form
          id="sib-form"
          method="POST"
          action="https://b55b2c6e.sibforms.com/serve/MUIFAHuOyh65aKbiM6NPvJkuuVI5o9cGpU496vUXU8PMUZoJiWW2iiuy4XMywAqh5O-Hch3-mCwotaiAm_Bg0ptFkErJkUaBTzgCoQErH_gOBc0FseUDMipJGu72IdGtic5YZRsvZpxUpK_sjPOyecrcJi8IeXqVx-YKU-vJVkOByx9l83FqdPl_0NZlTbS-2hS_QW7EuiItjtuRpA=="
          onSubmit={handleSubmit}
          className="px-6 py-6 space-y-4"
        >
          <div className="form__entry entry_block">
            <div className="entry__field relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <Input
                className="input bg-secondary/50 border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-200 text-base py-6 pl-12 pr-4 rounded-xl placeholder:text-muted-foreground/60"
                type="email"
                id="EMAIL"
                name="EMAIL"
                autoComplete="email"
                placeholder={t('hero.emailPlaceholder')}
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                data-required="true"
                required
                suppressHydrationWarning
              />
            </div>
          </div>

          <div className="sib-form-block relative">
            {/* 光晕背景效果 */}
            <div className="absolute inset-0 bg-transparent blur-xl rounded-2xl animate-pulse"></div>
            <Button
              className="sib-form-block__button sib-form-block__button-with-loader relative w-full bg-white text-black hover:bg-gray-50 dark:bg-black dark:text-white dark:hover:bg-zinc-900 font-extrabold py-7 px-8 text-xl md:text-2xl rounded-2xl shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 group border border-gray-200 dark:border-zinc-800 uppercase tracking-wider"
              form="sib-form"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <TranslatedText>{t('hero.submitting')}</TranslatedText>
                </>
              ) : (
                <>
                  <span className="relative z-10">
                    <TranslatedText>{t('hero.ctaButton')}</TranslatedText>
                  </span>
                  <svg className="w-6 h-6 transition-transform group-hover:translate-x-2 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </Button>
          </div>

          <input type="text" name="email_address_check" defaultValue="" className="input--hidden" style={{display: 'none'}} readOnly />
          <input type="hidden" name="locale" value={i18n.language === 'zh_CN' ? 'zh' : 'en'} />
          <input type="hidden" name="html_type" value="simple" />
        </form>

        {/* 底部隐私提示 */}
        <div className="px-6 pb-5 pt-0">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span><TranslatedText>{t('hero.privacyText')}</TranslatedText></span>
          </div>
        </div>
      </div>
    </div>
  );
};
