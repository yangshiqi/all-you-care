import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { zh_CN } from './locales/zh_CN';
import { getLanguageFromPath, isValidLanguage, DEFAULT_LANGUAGE } from './i18n-utils';

// 翻译资源
const resources = {
  en,
  'zh-CN': zh_CN,
};

// 检测用户语言（基于 URL 路径、localStorage 或浏览器语言）
const detectUserLanguage = (): string => {
  // 在服务端渲染时，使用默认语言（中文）
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  // 1. 首先检查 URL 路径中是否有语言前缀
  const pathname = window.location.pathname;
  const langFromPath = getLanguageFromPath(pathname);
  if (langFromPath) {
    // 保存到 localStorage 以便后续使用
    localStorage.setItem('language', langFromPath);
    return langFromPath;
  }

  // 2. 检查 localStorage
  const savedLang = localStorage.getItem('language');
  if (savedLang && isValidLanguage(savedLang)) {
    return savedLang;
  }
  
  // 兼容旧的 'zh' 值
  if (savedLang === 'zh') {
    localStorage.setItem('language', 'zh-CN');
    return 'zh-CN';
  }

  // 3. 检查浏览器语言
  const browserLang = navigator.language.toLowerCase();
  
  // 如果是中文相关语言，返回 zh-CN
  if (browserLang.startsWith('zh')) {
    const lang = 'zh-CN';
    localStorage.setItem('language', lang);
    return lang;
  }
  
  // 如果是英文，返回 en
  if (browserLang.startsWith('en')) {
    const lang = 'en';
    localStorage.setItem('language', lang);
    return lang;
  }
  
  // 默认返回中文
  return DEFAULT_LANGUAGE;
};

// 初始化 i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectUserLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: ['en', 'zh-CN'],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, // 在 Next.js 中禁用 Suspense
    },
  });

// 监听语言变化，更新 localStorage
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lng);
  }
});

export default i18n;
