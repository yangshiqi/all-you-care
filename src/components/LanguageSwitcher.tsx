import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Globe } from "lucide-react";

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    
    // 更新 HTML lang 属性以优化 SEO
    document.documentElement.lang = newLang;
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2"
      aria-label="Switch language"
    >
      <Globe className="w-4 h-4" />
      <span className="text-sm font-medium">
        {i18n.language === 'en' ? '中文' : 'EN'}
      </span>
    </Button>
  );
};
