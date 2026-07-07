"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { isValidLanguage, DEFAULT_LANGUAGE } from "@/lib/i18n-utils";

/**
 * Syncs the client i18n language to the URL `[lang]` segment. Rendered once in
 * `[lang]/layout` so it covers the whole app.
 *
 * Why the double-change: SSR renders with `DEFAULT_LANGUAGE` (server can't read
 * the URL) and `TranslatedText`'s `suppressHydrationWarning` freezes that text.
 * On `/en` the client i18n is already `en`, so a plain `changeLanguage('en')` is
 * a no-op and the frozen Chinese stays. Firing a real transition through the
 * default (which equals the frozen SSR text, so no extra flash) forces every
 * `useTranslation` consumer to repaint with the correct locale.
 */
export function LangSync({ lang }: { lang: string }) {
  const { i18n } = useTranslation();
  useEffect(() => {
    if (!isValidLanguage(lang)) return;
    if (i18n.language !== lang) {
      void i18n.changeLanguage(lang);
    } else if (lang !== DEFAULT_LANGUAGE) {
      void i18n.changeLanguage(DEFAULT_LANGUAGE).then(() => i18n.changeLanguage(lang));
    }
  }, [lang, i18n]);
  return null;
}
