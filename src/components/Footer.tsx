"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { TranslatedText } from "./TranslatedText";
import { useCurrentLanguage } from "@/hooks/use-current-language";
import { addLanguageToPath, type SupportedLanguage } from "@/lib/i18n-utils";

interface FooterProps {
  initialLang?: SupportedLanguage;
}

export const Footer = ({ initialLang }: FooterProps = {}) => {
  const { t } = useTranslation();
  const langFromHook = useCurrentLanguage();
  const lang = initialLang || langFromHook;

  const navLinks = [
    { href: "/issues", label: t("nav.issues") },
    { href: "/weekly", label: t("nav.weekly", "周报") },
    { href: "/tags", label: t("nav.tags") },
    { href: "/subscribe", label: t("nav.subscribe") },
  ];

  return (
    <footer className="border-t-4 border-primary bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-10 md:grid-cols-3 md:gap-12">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link
              href={addLanguageToPath("/", lang)}
              className="flex items-center gap-0 group hover:opacity-80 transition-opacity text-foreground"
            >
              <svg width="36" height="36" viewBox="0 0 513 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M110.525 103.85C109.017 104.485 109.097 187.272 110.525 191.876C112.033 196.797 113.859 199.654 117.352 202.829C121.241 206.322 123.86 207.671 132.036 210.529C135.608 211.799 143.466 214.656 149.577 216.879C155.689 219.101 163.706 222.038 167.437 223.308C171.167 224.657 177.438 226.88 181.327 228.388C185.296 229.817 194.106 233.071 201.012 235.531L213.474 240.056V271.726C213.474 289.109 213.553 303.476 213.712 303.555C213.791 303.714 233 303.952 256.335 304.19L298.801 304.587L299.594 392.692L301.579 396.581C304.119 401.582 308.643 405.233 314.834 407.297C319.676 408.964 320.946 408.964 361.665 408.805L403.574 408.567V319.668L401.749 316.096C399.129 311.096 395.716 307.762 390.954 305.619L386.906 303.793L299.991 303.317L300.15 271.488L300.388 239.659L311.5 235.77C317.612 233.706 326.343 230.531 330.947 228.864C344.758 223.705 369.761 214.577 377.778 211.64C381.905 210.132 386.906 208.306 388.811 207.592C393.653 205.846 398.733 200.924 401.352 195.527L403.574 191.082V103.771H360.316C319.755 103.771 316.819 103.85 313.167 105.279C308.167 107.184 303.325 111.549 301.261 116.074C299.674 119.487 299.594 121.153 299.197 159.729L298.801 199.813L296.975 202.433C293.086 207.83 293.641 207.751 257.209 207.989C233.079 208.147 223.713 207.989 222.046 207.274C220.776 206.798 218.553 204.893 217.045 203.147L214.347 200.051L213.87 121.233L211.648 116.709C209.187 111.787 205.615 108.295 199.98 105.517C196.408 103.771 196.091 103.771 153.943 103.612C130.607 103.532 111.002 103.612 110.525 103.85Z" fill="currentColor"></path>
                <path d="M127.829 304.269C121.876 305.301 118.701 307.048 115.05 311.096C109.414 317.525 109.493 316.811 109.652 365.308L109.89 408.567H152.355C184.423 408.567 195.614 408.329 198.154 407.535C203.393 405.948 209.029 401.026 211.569 395.708L213.87 391.105L214.108 348.322C214.267 318.001 214.108 305.301 213.474 304.666C212.362 303.555 134.02 303.158 127.829 304.269Z" fill="currentColor"></path>
              </svg>
              <span className="font-bold text-xl tracking-wide text-primary">SnapAllx</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              <TranslatedText>{t("footer.tagline")}</TranslatedText>
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={addLanguageToPath(link.href, lang)}
                className="text-sm hover:text-primary font-medium uppercase tracking-wider transition-colors w-fit"
              >
                <TranslatedText>{link.label}</TranslatedText>
              </Link>
            ))}
          </nav>

          {/* Subscribe CTA */}
          <div className="flex flex-col gap-4 md:items-start">
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              <TranslatedText>{t("footer.subscribePrompt")}</TranslatedText>
            </p>
            <Link
              href={addLanguageToPath("/subscribe", lang)}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold uppercase tracking-wider px-6 py-3 rounded-lg hover:opacity-90 transition-opacity w-fit"
            >
              <TranslatedText>{t("footer.subscribeButton")}</TranslatedText>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            <TranslatedText>{t("footer.rights")}</TranslatedText>
          </p>
        </div>
      </div>
    </footer>
  );
};
