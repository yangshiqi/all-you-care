import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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

// 不要在模块加载时初始化，等待组件挂载后再初始化
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { 
        translation: {
          "siteTitle": "AINews - Daily AI Roundup for Engineers",
          "siteDescription": "How over 80k top AI Engineers keep up with AI news, every weekday. We summarize top AI discords, reddits, and X/Twitter.",
          "nav": {
            "subscribe": "subscribe",
            "issues": "issues",
            "tags": "tags",
            "search": "Search (Cmd+K)"
          },
          "hero": {
            "title": "AINews",
            "byLine": "by smol.ai",
            "subtitle": "How over 80k top AI Engineers keep up, every weekday.",
            "description": "We summarize top AI discords + AI reddits + AI X/Twitters, and send you a roundup each day!",
            "emailPlaceholder": "your@work.email",
            "firstNamePlaceholder": "First Name",
            "lastNamePlaceholder": "Last Name",
            "ctaButton": "Solve my AI overload",
            "privacyText": "We respect your privacy.",
            "signupLink": "Full signup link here.",
            "testimonial1": "Highest-leverage 45 mins I spend everyday",
            "testimonial1Author": "Soumith",
            "testimonial2": "best AI newsletter atm",
            "testimonial2Note": "I'm not sure that enough people subscribe",
            "testimonial2Author": "Andrej",
            "testimonial3": "genuinely incredible",
            "testimonial3Author": "Chris",
            "testimonial4": "surprisingly decent",
            "testimonial4Author": "Hamel",
            "customNote": "You can pay for a customizable version here. Thanks to Pieter Levels for the Lex Fridman feature!",
            "toastTitle": "Thanks for subscribing!",
            "toastDescription": "Please check your email to confirm your subscription."
          },
          "recentIssues": {
            "title": "Last 30 days in AI",
            "filterLabel": "Filter titles:",
            "filterPlaceholder": ".*(?!not much).*$",
            "seeAll": "See all issues"
          },
          "issueDetail": {
            "backToIssues": "Back to Issues",
            "skipToMain": "Skip to Main",
            "showTags": "show/hide tags",
            "hideTags": "show/hide tags",
            "tableOfContents": "Table of Contents",
            "backToTop": "Back to Top"
          }
        }
      },
      zh: { 
        translation: {
          "siteTitle": "AINews - AI工程师每日资讯精选",
          "siteDescription": "超过8万顶尖AI工程师每个工作日获取AI新闻的方式。我们汇总顶级AI Discord、Reddit和X/Twitter内容。",
          "nav": {
            "subscribe": "订阅",
            "issues": "往期内容",
            "tags": "标签",
            "search": "搜索 (Cmd+K)"
          },
          "hero": {
            "title": "AINews",
            "byLine": "由 smol.ai 出品",
            "subtitle": "超过8万顶尖AI工程师每个工作日获取资讯的方式",
            "description": "我们汇总顶级AI Discord、Reddit和X/Twitter内容，每天为您发送精选资讯！",
            "emailPlaceholder": "你的工作邮箱",
            "firstNamePlaceholder": "名字",
            "lastNamePlaceholder": "姓氏",
            "ctaButton": "解决我的AI信息过载",
            "privacyText": "我们尊重您的隐私。",
            "signupLink": "完整订阅链接在此。",
            "testimonial1": "我每天花费的最高杠杆时间——45分钟",
            "testimonial1Author": "Soumith",
            "testimonial2": "目前最好的AI资讯邮件",
            "testimonial2Note": "我不确定是否有足够多的人订阅",
            "testimonial2Author": "Andrej",
            "testimonial3": "真的令人难以置信",
            "testimonial3Author": "Chris",
            "testimonial4": "出乎意料的不错",
            "testimonial4Author": "Hamel",
            "customNote": "您可以在此付费获取可定制版本。感谢Pieter Levels提供的Lex Fridman功能！",
            "toastTitle": "感谢订阅！",
            "toastDescription": "请查看您的邮箱以确认订阅。"
          },
          "recentIssues": {
            "title": "AI行业最近30天",
            "filterLabel": "筛选标题：",
            "filterPlaceholder": ".*(?!not much).*$",
            "seeAll": "查看所有往期"
          },
          "issueDetail": {
            "backToIssues": "返回期刊列表",
            "skipToMain": "跳转到主要内容",
            "showTags": "显示/隐藏标签",
            "hideTags": "显示/隐藏标签",
            "tableOfContents": "目录",
            "backToTop": "返回顶部"
          }
        }
      },
    },
    lng: detectUserLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;
