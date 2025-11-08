"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TranslatedText } from "./TranslatedText";

export const Hero = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t, i18n } = useTranslation();

  const handleSubmit = () => {
    // Brevo 表单直接提交，只需要设置 loading 状态
    setIsSubmitting(true);
    // 表单会自动提交到 Brevo，不需要阻止默认行为
  };

  return (
    <section className="py-16 md:py-24 paper-texture">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start max-w-6xl mx-auto">
          {/* Left column - Title and form */}
          <div>
            <div className="vintage-border bg-card p-8 md:p-12 mb-8 relative">
              <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-primary"></div>
              <h1 className="text-5xl md:text-7xl font-bold leading-none text-primary">
                <TranslatedText>{t('hero.title')}</TranslatedText>
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">
              <TranslatedText>{t('hero.byLine')}</TranslatedText>
            </p>
            <p className="text-2xl mb-8 leading-relaxed">
              <TranslatedText>{t('hero.subtitle')}</TranslatedText>
            </p>

            <form 
              id="sib-form" 
              method="POST" 
              action="https://b55b2c6e.sibforms.com/serve/MUIFAHuOyh65aKbiM6NPvJkuuVI5o9cGpU496vUXU8PMUZoJiWW2iiuy4XMywAqh5O-Hch3-mCwotaiAm_Bg0ptFkErJkUaBTzgCoQErH_gOBc0FseUDMipJGu72IdGtic5YZRsvZpxUpK_sjPOyecrcJi8IeXqVx-YKU-vJVkOByx9l83FqdPl_0NZlTbS-2hS_QW7EuiItjtuRpA=="
              onSubmit={handleSubmit}
              className="space-y-4 bg-card vintage-border p-6"
            >
              <div className="form__entry entry_block">
                <div className="entry__field">
                  <Input
                    className="input bg-background border-2 border-border"
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
                <label className="entry__error entry__error--primary" style={{fontSize: '16px', textAlign: 'left', fontFamily: 'Helvetica, sans-serif', color: '#661d1d', backgroundColor: '#ffeded', borderRadius: '3px', borderColor: '#ff4949'}}>
                </label>
              </div>
              
              <div className="sib-form-block" style={{textAlign: 'left'}}>
                <Button 
                  className="sib-form-block__button sib-form-block__button-with-loader w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider py-6 text-lg shadow-lg hover:shadow-xl border-4 border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  form="sib-form" 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <TranslatedText>{t('hero.submitting')}</TranslatedText>
                  ) : (
                    <TranslatedText>{t('hero.ctaButton')}</TranslatedText>
                  )}
                </Button>
              </div>
              
              <input type="text" name="email_address_check" defaultValue="" className="input--hidden" style={{display: 'none'}} readOnly />
              <input type="hidden" name="locale" value={i18n.language === 'zh_CN' ? 'zh' : 'en'} />
              <input type="hidden" name="html_type" value="simple" />
            </form>

            <p className="text-xs text-muted-foreground mt-4 monospace">
              <TranslatedText>
                {t('hero.privacyText')}
              </TranslatedText>
            </p>
          </div>

          {/* Right column - Description and testimonials */}
          <div className="space-y-8">
            <div className="text-xl leading-relaxed">
                <TranslatedText>{t('hero.description')}</TranslatedText>
            </div>

            <div className="space-y-6">
              
              <blockquote className="bg-card vintage-border p-4 relative">
                <div className="absolute top-2 left-2 text-4xl text-primary opacity-30">&ldquo;</div>
                <p className="italic text-foreground pl-6">
                  <TranslatedText>{t('hero.testimonial1')}</TranslatedText>
                </p>
                <footer className="mt-2 text-sm font-bold text-muted-foreground text-right">
                  — <TranslatedText>{t('hero.testimonial1Author')}</TranslatedText>
                </footer>
              </blockquote>

              <blockquote className="bg-card vintage-border p-4 relative">
                <div className="absolute top-2 left-2 text-4xl text-primary opacity-30">&ldquo;</div>
                <p className="italic text-foreground pl-6">
                  <TranslatedText>
                    {t('hero.testimonial2')} {t('hero.testimonial2Note') && (
                      <TranslatedText> and &ldquo;{t('hero.testimonial2Note')}&rdquo;</TranslatedText>
                    )}
                  </TranslatedText>
                </p>
                <footer className="mt-2 text-sm font-bold text-muted-foreground text-right">
                  — <TranslatedText>{t('hero.testimonial2Author')}</TranslatedText>
                </footer>
              </blockquote>

              <blockquote className="bg-card vintage-border p-4 relative">
                <div className="absolute top-2 left-2 text-4xl text-primary opacity-30">&ldquo;</div>
                <p className="italic text-foreground pl-6">
                  <TranslatedText>{t('hero.testimonial3')}</TranslatedText>
                </p>
                <footer className="mt-2 text-sm font-bold text-muted-foreground text-right">
                  — <TranslatedText>{t('hero.testimonial3Author')}</TranslatedText>
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
