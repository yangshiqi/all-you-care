import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { zh_CN } from './locales/zh_CN';

// 翻译资源
const resources = {
  en,
  'zh-CN': zh_CN,
};

// 检测用户语言（基于浏览器语言或地理位置）
const detectUserLanguage = (): string => {
  // 在服务端渲染时，使用默认语言
  if (typeof window === 'undefined') {
    return 'en';
  }

  // 首先检查 localStorage
  const savedLang = localStorage.getItem('language');
  if (savedLang) {
    // 兼容旧的 'zh' 值
    return savedLang === 'zh' ? 'zh-CN' : savedLang;
  }

  // 然后检查浏览器语言
  const browserLang = navigator.language.toLowerCase();
  
  // 如果是中文相关语言，返回 zh-CN
  if (browserLang.startsWith('zh')) {
    return 'zh-CN';
  }
  
  // 默认返回英文
  return 'en';
};

// 初始化 i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectUserLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, // 在 Next.js 中禁用 Suspense
    },
  });

export default i18n;
