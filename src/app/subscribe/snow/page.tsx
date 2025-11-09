"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import Script from "next/script";
import { Header } from "@/components/Header";
import { TranslatedText } from "@/components/TranslatedText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export default function SnowSubscribePage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t, i18n } = useTranslation();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 客户端验证
    if (!email || !email.trim()) {
      // 显示错误消息
      const errorPanel = document.getElementById("error-message");
      if (errorPanel) {
        errorPanel.style.display = "block";
        const errorText = errorPanel.querySelector(".sib-form-message-panel__inner-text");
        if (errorText) {
          errorText.textContent = "This field cannot be left blank.";
        }
      }
      
      // 高亮输入框
      const emailInput = document.getElementById("EMAIL") as HTMLInputElement;
      if (emailInput) {
        emailInput.focus();
        emailInput.style.borderColor = "#ff4949";
      }
      
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      // 显示错误消息
      const errorPanel = document.getElementById("error-message");
      if (errorPanel) {
        errorPanel.style.display = "block";
        const errorText = errorPanel.querySelector(".sib-form-message-panel__inner-text");
        if (errorText) {
          errorText.textContent = "The information provided is invalid. Please review the field format and try again.";
        }
      }
      
      // 高亮输入框
      const emailInput = document.getElementById("EMAIL") as HTMLInputElement;
      if (emailInput) {
        emailInput.focus();
        emailInput.style.borderColor = "#ff4949";
      }
      
      return;
    }

    // 隐藏错误消息
    const errorPanel = document.getElementById("error-message");
    if (errorPanel) {
      errorPanel.style.display = "none";
    }

    // 重置输入框样式
    const emailInput = document.getElementById("EMAIL") as HTMLInputElement;
    if (emailInput) {
      emailInput.style.borderColor = "";
    }

    // 验证通过，设置 loading 状态并提交表单
    setIsSubmitting(true);
    
    // 提交表单到 Brevo
    const form = e.currentTarget;
    form.submit();
  };

  return (
    <>
    

      <div className="min-h-screen bg-background">
        <Header />
        <main className="paper-texture py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="sib-form sib-form-container" id="sib-form-container">
                {/* 错误消息面板 */}
                <div
                  id="error-message"
                  className="sib-form-message-panel"
                  style={{
                    fontSize: "16px",
                    textAlign: "left",
                    fontFamily: "Helvetica, sans-serif",
                    color: "#661d1d",
                    backgroundColor: "#ffeded",
                    borderRadius: "3px",
                    borderColor: "#ff4949",
                    maxWidth: "100%",
                    display: "none",
                    marginBottom: "1rem",
                    padding: "12px",
                    border: "2px solid #ff4949",
                  }}
                >
                  <div className="sib-form-message-panel__text sib-form-message-panel__text--center">
                    <svg viewBox="0 0 512 512" className="sib-icon sib-notification__icon" style={{ width: "20px", height: "20px", display: "inline-block", marginRight: "8px", verticalAlign: "middle" }}>
                      <path d="M256 40c118.621 0 216 96.075 216 216 0 119.291-96.61 216-216 216-119.244 0-216-96.562-216-216 0-119.203 96.602-216 216-216m0-32C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm-11.49 120h22.979c6.823 0 12.274 5.682 11.99 12.5l-7 168c-.268 6.428-5.556 11.5-11.99 11.5h-8.979c-6.433 0-11.722-5.073-11.99-11.5l-7-168c-.283-6.818 5.167-12.5 11.99-12.5zM256 340c-15.464 0-28 12.536-28 28s12.536 28 28 28 28-12.536 28-28-12.536-28-28-28z" />
                    </svg>
                    <span className="sib-form-message-panel__inner-text" style={{ display: "inline-block", verticalAlign: "middle" }}>
                      Your subscription could not be saved. Please try again.
                    </span>
                  </div>
                </div>

                {/* 成功消息面板 */}
                <div
                  id="success-message"
                  className="sib-form-message-panel"
                  style={{
                    fontSize: "16px",
                    textAlign: "left",
                    fontFamily: "Helvetica, sans-serif",
                    color: "#085229",
                    backgroundColor: "#e7faf0",
                    borderRadius: "3px",
                    borderColor: "#13ce66",
                    maxWidth: "100%",
                    display: "none",
                    marginBottom: "1rem",
                    padding: "12px",
                    border: "2px solid #13ce66",
                  }}
                >
                  <div className="sib-form-message-panel__text sib-form-message-panel__text--center">
                    <svg viewBox="0 0 512 512" className="sib-icon sib-notification__icon" style={{ width: "20px", height: "20px", display: "inline-block", marginRight: "8px", verticalAlign: "middle" }}>
                      <path d="M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 464c-118.664 0-216-96.055-216-216 0-118.663 96.055-216 216-216 118.664 0 216 96.055 216 216 0 118.663-96.055 216-216 216zm141.63-274.961L217.15 376.071c-4.705 4.667-12.303 4.637-16.97-.068l-85.878-86.572c-4.667-4.705-4.637-12.303.068-16.97l8.52-8.451c4.705-4.667 12.303-4.637 16.97.068l68.976 69.533 163.441-162.13c4.705-4.667 12.303-4.637 16.97.068l8.451 8.52c4.668 4.705 4.637 12.303-.068 16.97z" />
                    </svg>
                    <span className="sib-form-message-panel__inner-text" style={{ display: "inline-block", verticalAlign: "middle" }}>
                      Your subscription has been successful.
                    </span>
                  </div>
                </div>

                {/* 标题卡片 */}
                <div className="vintage-border bg-card p-8 md:p-12 mb-8 relative">
                  <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-primary"></div>
                  <h1 className="text-4xl md:text-5xl font-bold leading-none text-primary mb-4">
                    <TranslatedText>{t("snowSubscribe.title")}</TranslatedText>
                  </h1>
                  <p className="text-base md:text-lg text-muted-foreground">
                    <TranslatedText>{t("snowSubscribe.note")}</TranslatedText>
                  </p>
                </div>

                {/* 表单容器 */}
                <div
                  id="sib-container"
                  className="sib-container--large sib-container--vertical vintage-border bg-card p-6 md:p-8 relative"
                >
                  <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-primary"></div>
                  <form
                    id="sib-form"
                    method="POST"
                    action="https://b55b2c6e.sibforms.com/serve/MUIFAGakGfveLjDGZ_ktRPZ8a9Mci8tRfyQ_UQo8xDeN32iu-z2n4cB4nqp5ig9QPQMZEMHCfQCpV1fHQASR6vXhjXW5IP88UcJy5RSsSXTYhmFGZRH1UBjAlucq2Ps1fhOF5KQa0mxz7-dg1fDzpnJ3QmPW_FrZk27e7SBTeaYDcz95Z_QzpEkKLbddwhJ84RkYGmESx0dQQEwLTQ=="
                    data-type="subscription"
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    {/* 图片区域 */}
                    <div className="w-full">
                      <div className="relative w-full aspect-[500/334] overflow-hidden rounded-lg">
                        <Image
                          src="/welcome.jpg"
                          alt="Snowboarders in snow"
                          fill
                          className="object-cover"
                          priority
                        />
                      </div>
                    </div>

                    {/* 邮箱输入 */}
                    <div className="form__entry entry_block">
                      <label
                        className="block text-base md:text-lg font-medium text-foreground mb-2"
                        htmlFor="EMAIL"
                      >
                        <TranslatedText>{t("snowSubscribe.emailLabel")}</TranslatedText>
                      </label>
                      <div className="entry__field">
                        <Input
                          className="input bg-background border-2 border-border w-full"
                          type="email"
                          id="EMAIL"
                          name="EMAIL"
                          autoComplete="email"
                          placeholder={t("snowSubscribe.emailPlaceholder")}
                          data-required="true"
                          required
                          value={email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setEmail(e.target.value);
                            // 清除错误状态
                            const errorPanel = document.getElementById("error-message");
                            if (errorPanel) {
                              errorPanel.style.display = "none";
                            }
                            // 重置输入框样式
                            e.target.style.borderColor = "";
                          }}
                          disabled={isSubmitting}
                          suppressHydrationWarning
                        />
                      </div>
                      <label
                        className="entry__error entry__error--primary"
                        style={{
                          fontSize: "16px",
                          textAlign: "left",
                          fontFamily: "Helvetica, sans-serif",
                          color: "#661d1d",
                          backgroundColor: "#ffeded",
                          borderRadius: "3px",
                          borderColor: "#ff4949",
                        }}
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        <TranslatedText>{t("snowSubscribe.emailHint")}</TranslatedText>
                      </p>
                    </div>

                    {/* 提交按钮 */}
                    <div className="sib-form-block">
                      <Button
                        className="sib-form-block__button sib-form-block__button-with-loader w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider py-6 text-lg shadow-lg hover:shadow-xl border-4 border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                        form="sib-form"
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <TranslatedText>{t("snowSubscribe.submitting")}</TranslatedText>
                        ) : (
                          <TranslatedText>{t("snowSubscribe.submitButton")}</TranslatedText>
                        )}
                      </Button>
                    </div>

                    {/* 隐藏字段 */}
                    <input
                      type="text"
                      name="email_address_check"
                      defaultValue=""
                      className="input--hidden"
                      style={{ display: "none" }}
                      readOnly
                    />
                    <input type="hidden" name="locale" value={i18n.language === "zh_CN" ? "zh" : "en"} />
                    <input type="hidden" name="html_type" value="simple" />
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Brevo 脚本 */}
      <Script id="brevo-form-config" strategy="afterInteractive">
        {`
          window.REQUIRED_CODE_ERROR_MESSAGE = 'Please choose a country code';
          window.LOCALE = '${i18n.language === "zh_CN" ? "zh" : "en"}';
          window.EMAIL_INVALID_MESSAGE = window.SMS_INVALID_MESSAGE = "The information provided is invalid. Please review the field format and try again.";
          window.REQUIRED_ERROR_MESSAGE = "This field cannot be left blank. ";
          window.GENERIC_INVALID_MESSAGE = "The information provided is invalid. Please review the field format and try again.";
          window.translation = {
            common: {
              selectedList: '{quantity} list selected',
              selectedLists: '{quantity} lists selected',
              selectedOption: '{quantity} selected',
              selectedOptions: '{quantity} selected',
            }
          };
          var AUTOHIDE = Boolean(0);
        `}
      </Script>
      <Script
        defer
        src="https://sibforms.com/forms/end-form/build/main.js"
        strategy="afterInteractive"
      />
    </>
  );
}

