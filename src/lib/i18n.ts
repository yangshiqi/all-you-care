import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import zh from '../locales/zh.json';

// 检测用户语言（基于浏览器语言或地理位置）
const detectUserLanguage = (): string => {
  // 首先检查 localStorage
  const savedLang = localStorage.getItem('language');
  if (savedLang) return savedLang;

  // 然后检查浏览器语言
  const browserLang = navigator.language.toLowerCase();
  
  // 如果是中文相关语言，返回 zh
  if (browserLang.startsWith('zh')) {
    return 'zh';
  }
  
  // 默认返回英文
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    lng: detectUserLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
