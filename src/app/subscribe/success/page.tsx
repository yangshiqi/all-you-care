"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { TranslatedText } from "@/components/TranslatedText";
import { Button } from "@/components/ui/button";

function SubscribeSuccessContent() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  // 从 URL 参数获取邮箱（如果有）
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="paper-texture">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto">
          {/* 成功图标和标题 */}
          <div className="text-center mb-12">
            <div className="inline-block mb-6">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-primary/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 md:w-16 md:h-16 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              <TranslatedText>{t("subscribeSuccess.title")}</TranslatedText>
            </h1>
            <p className="text-xl text-muted-foreground">
              <TranslatedText>{t("subscribeSuccess.subtitle")}</TranslatedText>
            </p>
          </div>

          {/* 成功消息卡片 */}
          <div className="vintage-border bg-card p-8 md:p-12 mb-8 relative">
            <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-primary"></div>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-3">
                  <TranslatedText>{t("subscribeSuccess.messageTitle")}</TranslatedText>
                </h2>
                <p className="text-lg leading-relaxed text-foreground">
                  <TranslatedText>{t("subscribeSuccess.message")}</TranslatedText>
                </p>
              </div>

              {email && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    <TranslatedText>{t("subscribeSuccess.emailLabel")}</TranslatedText>
                  </p>
                  <p className="text-lg font-mono text-primary break-all">{email}</p>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <TranslatedText>{t("subscribeSuccess.nextSteps")}</TranslatedText>
                </p>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider shadow-none border-2 border-primary"
            >
              <Link href="/">
                <TranslatedText>{t("subscribeSuccess.backToHome")}</TranslatedText>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-2 border-border hover:border-primary font-bold uppercase tracking-wider"
            >
              <Link href="/issues">
                <TranslatedText>{t("subscribeSuccess.viewIssues")}</TranslatedText>
              </Link>
            </Button>
          </div>

          {/* 额外信息 */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              <TranslatedText>{t("subscribeSuccess.additionalInfo")}</TranslatedText>
            </p>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}

export default function SubscribeSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Header />
        <main className="paper-texture">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    }>
      <SubscribeSuccessContent />
    </Suspense>
  );
}

