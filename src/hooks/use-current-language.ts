"use client";

import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { isValidLanguage, DEFAULT_LANGUAGE, type SupportedLanguage } from "@/lib/i18n-utils";

/**
 * Hook to get the current language from URL params or i18n
 */
export function useCurrentLanguage(): SupportedLanguage {
  const params = useParams();
  const { i18n } = useTranslation();
  
  // 首先尝试从 URL 参数获取
  const langFromParams = params?.lang as string | undefined;
  if (langFromParams && isValidLanguage(langFromParams)) {
    return langFromParams;
  }
  
  // 然后尝试从 i18n 获取
  const langFromI18n = i18n.language;
  if (isValidLanguage(langFromI18n)) {
    return langFromI18n;
  }
  
  // 兼容旧的 'zh' 值
  if (langFromI18n === 'zh') {
    return 'zh-CN';
  }
  
  // 默认返回中文
  return DEFAULT_LANGUAGE;
}

