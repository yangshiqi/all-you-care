"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useCurrentLanguage } from "@/hooks/use-current-language";
import { switchLanguageInPath, type SupportedLanguage } from "@/lib/i18n-utils";

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const currentLang = useCurrentLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLanguage = () => {
    const newLang: SupportedLanguage = currentLang === 'en' ? 'zh-CN' : 'en';
    
    // 切换 URL 路径中的语言（先切换 URL，让页面重新加载）
    const newPath = switchLanguageInPath(pathname, newLang);
    
    // 更新 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', newLang);
    }
    
    // 更新 i18n（在导航之前更新，确保状态一致）
    i18n.changeLanguage(newLang);
    
    // 使用 replace 而不是 push，避免在历史记录中留下太多条目
    router.replace(newPath);
  };

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2 uppercase tracking-wider"
        disabled
      >
        <Globe className="w-4 h-4" />
        EN
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2 uppercase tracking-wider"
    >
      <Globe className="w-4 h-4" />
      {currentLang === 'en' ? '中文' : 'EN'}
    </Button>
  );
};
