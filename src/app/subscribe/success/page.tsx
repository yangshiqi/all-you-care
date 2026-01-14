"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { TranslatedText } from "@/components/TranslatedText";
import { Button } from "@/components/ui/button";
import { useCurrentLanguage } from "@/hooks/use-current-language";
import { addLanguageToPath, getLanguageFromPath } from "@/lib/i18n-utils";

function SubscribeSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const currentLang = useCurrentLanguage();
  const [isRedirecting, setIsRedirecting] = useState(true);

  // 自动重定向到对应的语言路由
  useEffect(() => {
    // 检查当前路径是否已经包含语言前缀
    const langFromPath = getLanguageFromPath(pathname);
    
    // 如果路径已经包含语言前缀，不需要重定向
    if (langFromPath) {
      setIsRedirecting(false);
      return;
    }
    
    // 构建新的 URL，包含语言前缀和所有查询参数
    const email = searchParams.get("email");
    const status = searchParams.get("status");
    const activated = searchParams.get("activated");
    
    // 构建查询参数字符串
    const queryParams = new URLSearchParams();
    if (email) queryParams.set("email", email);
    if (status) queryParams.set("status", status);
    if (activated) queryParams.set("activated", activated);
    
    const queryString = queryParams.toString();
    const newPath = addLanguageToPath("/subscribe/success", currentLang) + (queryString ? `?${queryString}` : "");
    
    // 重定向到语言路由
    router.replace(newPath);
    setIsRedirecting(false);
  }, [currentLang, router, searchParams, pathname]);

  // 如果正在重定向，显示加载状态
  if (isRedirecting) {
    return (
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
    );
  }

  // 从 URL 参数获取邮箱和状态
  const email = searchParams.get("email");
  const status = searchParams.get("status") || searchParams.get("activated");
  
  // 判断是否为激活成功状态
  const isActivated = status === "activated" || status === "true" || status === "1";

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
                {isActivated ? (
                  // 激活成功：对勾图标
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
                ) : (
                  // 待激活：邮箱图标
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              <TranslatedText>
                {isActivated 
                  ? t("subscribeSuccess.activatedTitle") 
                  : t("subscribeSuccess.title")
                }
              </TranslatedText>
            </h1>
            <p className="text-xl text-muted-foreground">
              <TranslatedText>
                {isActivated 
                  ? t("subscribeSuccess.activatedSubtitle") 
                  : t("subscribeSuccess.subtitle")
                }
              </TranslatedText>
            </p>
          </div>

          {/* 成功消息卡片 */}
          <div className="vintage-border bg-card p-8 md:p-12 mb-8 relative">
            <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-primary"></div>
            
            <div className="space-y-6">
              {isActivated ? (
                // 激活成功状态
                <>
                  <div>
                    {/*<h2 className="text-2xl font-bold text-primary mb-3">
                      <TranslatedText>{t("subscribeSuccess.activatedMessageTitle")}</TranslatedText>
                    </h2>*/}
                    <p className="text-lg leading-relaxed text-foreground mb-4">
                      <TranslatedText>{t("subscribeSuccess.activatedMessage")}</TranslatedText>
                    </p>
                    
                    {/* 成功提示 */}
                    <div className="bg-primary/10 dark:bg-primary/20 border-2 border-primary/20 dark:border-primary/80 p-6 rounded-lg mt-6">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <svg
                            className="w-6 h-6 text-primary dark:text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-primary dark:text-primary mb-2">
                            <TranslatedText>{t("subscribeSuccess.activatedSuccessTitle")}</TranslatedText>
                          </h3>
                          <p className="text-base leading-relaxed text-primary dark:text-primary">
                            <TranslatedText>{t("subscribeSuccess.activatedSuccessMessage")}</TranslatedText>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // 待激活状态
                <>
                  {/* 邮箱图标提示 */}
                  <div className="text-center mb-6">
                    <div className="inline-block w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 md:w-10 md:h-10 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-primary mb-3">
                      <TranslatedText>{t("subscribeSuccess.messageTitle")}</TranslatedText>
                    </h2>
                    <p className="text-lg leading-relaxed text-foreground mb-4">
                      <TranslatedText>{t("subscribeSuccess.message")}</TranslatedText>
                    </p>
                    
                    {/* 激活提示 */}
                    <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-lg mt-6">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <svg
                            className="w-6 h-6 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-primary mb-2">
                            <TranslatedText>{t("subscribeSuccess.activationTitle")}</TranslatedText>
                          </h3>
                          <p className="text-base leading-relaxed text-foreground">
                            <TranslatedText>{t("subscribeSuccess.activationMessage")}</TranslatedText>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {email && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    <TranslatedText>{t("subscribeSuccess.emailLabel")}</TranslatedText>
                  </p>
                  <p className="text-lg font-mono text-primary break-all">{email}</p>
                </div>
              )}
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
              <Link href={addLanguageToPath("/issues", currentLang)}>
                <TranslatedText>{t("subscribeSuccess.viewIssues")}</TranslatedText>
              </Link>
            </Button>
          </div>

          {/* 额外信息 */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              <TranslatedText>
                {isActivated 
                  ? t("subscribeSuccess.activatedAdditionalInfo") 
                  : t("subscribeSuccess.additionalInfo")
                }
              </TranslatedText>
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

