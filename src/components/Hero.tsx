"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { TranslatedText } from "./TranslatedText";

export const Hero = () => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || t('hero.subscribeError'));
      }

      // 跳转到成功页面，通过 URL 参数传递邮箱
      const successUrl = `/subscribe/success?email=${encodeURIComponent(email)}`;
      router.push(successUrl);
    } catch (error) {
      console.error('Subscribe error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : t('hero.subscribeError');
      
      toast({
        title: t('hero.errorTitle'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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
            <p className="text-xl mb-8 leading-relaxed">
              <TranslatedText>{t('hero.subtitle')}</TranslatedText>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 bg-card vintage-border p-6">
              <Input
                type="email"
                placeholder={t('hero.emailPlaceholder')}
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                className="bg-background border-2 border-border"
                suppressHydrationWarning
              />
              {/*<Input
                type="text"
                placeholder={t('hero.firstNamePlaceholder')}
                value={firstName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                className="bg-background border-2 border-border"
                suppressHydrationWarning
              />
              <Input
                type="text"
                placeholder={t('hero.lastNamePlaceholder')}
                value={lastName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                className="bg-background border-2 border-border"
                suppressHydrationWarning
              />*/}
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider py-6 text-lg shadow-lg hover:shadow-xl border-4 border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <TranslatedText>{t('hero.submitting')}</TranslatedText>
                ) : (
                  <TranslatedText>{t('hero.ctaButton')}</TranslatedText>
                )}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground mt-4 monospace">
              <TranslatedText>
                {t('hero.privacyText')}
              </TranslatedText>
            </p>
          </div>

          {/* Right column - Description and testimonials */}
          <div className="space-y-8">
            <div className="border-t-2 border-b-2 border-primary py-4">
              <p className="text-xl leading-relaxed">
                <TranslatedText>{t('hero.description')}</TranslatedText>
              </p>
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

            <p className="text-sm italic text-muted-foreground text-center border-t border-border pt-4 monospace">
              <TranslatedText>{t('hero.customNote')}</TranslatedText>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
