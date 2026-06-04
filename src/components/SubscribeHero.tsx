"use client";

import { useTranslation } from "react-i18next";
import { TranslatedText } from "./TranslatedText";
import { SubscribeBox } from "./SubscribeBox";

const CheckIcon = () => (
  <svg className="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

/**
 * 独立订阅落地页的主体：居中单栏（大标题 + 副文案 + 3 个卖点 + 复用的 SubscribeBox）。
 */
export const SubscribeHero = () => {
  const { t } = useTranslation();

  const benefits = [
    t("subscribePage.benefit1"),
    t("subscribePage.benefit2"),
    t("subscribePage.benefit3"),
  ];

  return (
    <section className="py-16 md:py-24 paper-texture">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto flex flex-col items-center text-center">
          <div className="vintage-border bg-card px-6 py-6 md:px-10 md:py-8 mb-8 relative">
            <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-foreground"></div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-foreground"></div>
            <h1 className="text-4xl md:text-5xl font-bold leading-none text-foreground">
              <TranslatedText>{t("subscribePage.title")}</TranslatedText>
            </h1>
          </div>

          <p className="text-lg md:text-xl mb-8 leading-relaxed text-muted-foreground">
            <TranslatedText>{t("subscribePage.subtitle")}</TranslatedText>
          </p>

          <ul className="flex flex-col gap-3 mb-10 text-left">
            {benefits.map((benefit, i) => (
              <li key={i} className="flex items-center gap-3">
                <CheckIcon />
                <span className="text-base font-medium">
                  <TranslatedText>{benefit}</TranslatedText>
                </span>
              </li>
            ))}
          </ul>

          <SubscribeBox showHeader={false} className="w-full max-w-lg" />
        </div>
      </div>
    </section>
  );
};
