import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export const SEOHead = () => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // 动态更新页面标题
    document.title = t('siteTitle');
    
    // 更新 meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t('siteDescription'));
    }
    
    // 更新 html lang 属性
    document.documentElement.lang = i18n.language;
    
    // 更新 Open Graph meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', t('siteTitle'));
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', t('siteDescription'));
    }
    
    // 更新 Twitter meta tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', t('siteTitle'));
    }
    
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', t('siteDescription'));
    }
  }, [t, i18n.language]);

  return null;
};
