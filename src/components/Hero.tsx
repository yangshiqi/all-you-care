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
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start max-w-6xl mx-auto">
          {/* Left column - Title and form */}
          <div>
            <div className="bg-primary text-primary-foreground p-8 md:p-12 mb-8 inline-block">
              <h1 className="text-5xl md:text-7xl font-bold leading-none">{t('hero.title')}</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{t('hero.byLine')}</p>
            <p className="text-lg mb-8">{t('hero.subtitle')}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder={t('hero.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background"
              />
              <Input
                type="text"
                placeholder={t('hero.firstNamePlaceholder')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-background"
              />
              <Input
                type="text"
                placeholder={t('hero.lastNamePlaceholder')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-background"
              />
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                {t('hero.ctaButton')}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground mt-4">
              {t('hero.privacyText')} <a href="/subscribe" className="underline">{t('hero.signupLink')}</a>
            </p>
          </div>

          {/* Right column - Description and testimonials */}
          <div className="space-y-6">
            <p className="text-lg">
              {t('hero.description')}
            </p>

            <blockquote className="italic text-muted-foreground border-l-2 border-border pl-4">
              "{t('hero.testimonial1')}" - <span className="font-medium">{t('hero.testimonial1Author')}</span>
            </blockquote>

            <blockquote className="italic text-muted-foreground border-l-2 border-border pl-4">
              "{t('hero.testimonial2')}" {t('hero.testimonial2Note') && `and "${t('hero.testimonial2Note')}"`} - <span className="font-medium">{t('hero.testimonial2Author')}</span>
            </blockquote>

            <blockquote className="italic text-muted-foreground border-l-2 border-border pl-4">
              "{t('hero.testimonial3')}" - <span className="font-medium">{t('hero.testimonial3Author')}</span>
            </blockquote>

            <blockquote className="italic text-muted-foreground border-l-2 border-border pl-4">
              "{t('hero.testimonial4')}" - <span className="font-medium">{t('hero.testimonial4Author')}</span>
            </blockquote>

            <p className="text-sm italic text-muted-foreground">
              {t('hero.customNote')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
