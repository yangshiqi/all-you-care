import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export const Hero = () => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: t('hero.toastTitle'),
      description: t('hero.toastDescription'),
    });
    setEmail("");
    setFirstName("");
    setLastName("");
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
              <h1 className="text-5xl md:text-7xl font-bold leading-none text-primary">{t('hero.title')}</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">{t('hero.byLine')}</p>
            <p className="text-xl mb-8 leading-relaxed">{t('hero.subtitle')}</p>

            <form onSubmit={handleSubmit} className="space-y-4 bg-card vintage-border p-6">
              <Input
                type="email"
                placeholder={t('hero.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background border-2 border-border"
              />
              <Input
                type="text"
                placeholder={t('hero.firstNamePlaceholder')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-background border-2 border-border"
              />
              <Input
                type="text"
                placeholder={t('hero.lastNamePlaceholder')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-background border-2 border-border"
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider shadow-none border-2 border-primary">
                {t('hero.ctaButton')}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground mt-4 monospace">
              {t('hero.privacyText')} <a href="/subscribe" className="underline font-bold">{t('hero.signupLink')}</a>
            </p>
          </div>

          {/* Right column - Description and testimonials */}
          <div className="space-y-8">
            <div className="border-t-2 border-b-2 border-primary py-4">
              <p className="text-xl leading-relaxed">
                {t('hero.description')}
              </p>
            </div>

            <div className="space-y-6">
              <div className="text-center mb-4">
                <span className="text-sm uppercase tracking-widest text-muted-foreground">━━━ Testimonials ━━━</span>
              </div>
              
              <blockquote className="bg-card vintage-border p-4 relative">
                <div className="absolute top-2 left-2 text-4xl text-primary opacity-30">"</div>
                <p className="italic text-foreground pl-6">{t('hero.testimonial1')}</p>
                <footer className="mt-2 text-sm font-bold text-muted-foreground text-right">— {t('hero.testimonial1Author')}</footer>
              </blockquote>

              <blockquote className="bg-card vintage-border p-4 relative">
                <div className="absolute top-2 left-2 text-4xl text-primary opacity-30">"</div>
                <p className="italic text-foreground pl-6">{t('hero.testimonial2')} {t('hero.testimonial2Note') && `and "${t('hero.testimonial2Note')}"`}</p>
                <footer className="mt-2 text-sm font-bold text-muted-foreground text-right">— {t('hero.testimonial2Author')}</footer>
              </blockquote>

              <blockquote className="bg-card vintage-border p-4 relative">
                <div className="absolute top-2 left-2 text-4xl text-primary opacity-30">"</div>
                <p className="italic text-foreground pl-6">{t('hero.testimonial3')}</p>
                <footer className="mt-2 text-sm font-bold text-muted-foreground text-right">— {t('hero.testimonial3Author')}</footer>
              </blockquote>

              <blockquote className="bg-card vintage-border p-4 relative">
                <div className="absolute top-2 left-2 text-4xl text-primary opacity-30">"</div>
                <p className="italic text-foreground pl-6">{t('hero.testimonial4')}</p>
                <footer className="mt-2 text-sm font-bold text-muted-foreground text-right">— {t('hero.testimonial4Author')}</footer>
              </blockquote>
            </div>

            <p className="text-sm italic text-muted-foreground text-center border-t border-border pt-4 monospace">
              {t('hero.customNote')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
