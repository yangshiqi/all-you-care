# 语言文件获取逻辑分析

**创建日期**: 2025-01-XX  
**分析范围**: 语言检测、语言文件获取、语言判断机制

## 📋 概述

本项目采用**多层级语言检测机制**，通过 URL 路径、Cookie、浏览器语言等多种方式确定用户语言偏好，并确保所有页面都包含语言前缀。

## 🔄 语言检测流程

### 1. 服务端检测流程（Middleware）

**文件**: `src/middleware.ts`

#### 流程步骤

```
用户请求 → Middleware 拦截 → 检查路径 → 检测语言 → 设置 Cookie → 重定向/继续
```

#### 详细逻辑

```typescript
// 1. 检查路径中是否已有语言前缀
const langFromPath = getLanguageFromPath(pathname);

if (langFromPath) {
  // 路径中已有语言前缀，设置 cookie 并继续
  response.cookies.set('language', langFromPath);
  return response;
}

// 2. 路径中没有语言前缀，需要添加
const detectedLang = detectLanguage(request, pathname);
const newPathname = addLanguageToPath(pathname, detectedLang);

// 3. 重定向到带语言前缀的 URL
return NextResponse.redirect(url);
```

#### 检测优先级（`detectLanguage` 函数）

**优先级顺序**:
1. **URL 路径** (`getLanguageFromPath`) - 最高优先级
2. **Cookie** (`getLanguageFromCookie`) - 用户之前的偏好
3. **浏览器语言** (`getDefaultLanguage`) - Accept-Language header
4. **默认语言** (`DEFAULT_LANGUAGE`) - 中文 (zh-CN)

### 2. 客户端检测流程（i18n.ts）

**文件**: `src/lib/i18n.ts`

#### 流程步骤

```
组件加载 → detectUserLanguage() → 检查 URL → 检查 localStorage → 检查浏览器 → 返回语言
```

#### 详细逻辑

```typescript
const detectUserLanguage = (): string => {
  // 服务端渲染时，使用默认语言
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  // 1. 首先检查 URL 路径中是否有语言前缀
  const langFromPath = getLanguageFromPath(window.location.pathname);
  if (langFromPath) {
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
  if (browserLang.startsWith('zh')) {
    return 'zh-CN';
  }
  if (browserLang.startsWith('en')) {
    return 'en';
  }
  
  // 4. 默认返回中文
  return DEFAULT_LANGUAGE;
};
```

#### 检测优先级（客户端）

**优先级顺序**:
1. **URL 路径** - 最高优先级
2. **localStorage** - 用户之前的偏好
3. **浏览器语言** (`navigator.language`) - 浏览器设置
4. **默认语言** - 中文 (zh-CN)

## 🔍 核心工具函数

### 1. 从路径提取语言 (`getLanguageFromPath`)

**文件**: `src/lib/i18n-utils.ts`

```typescript
export function getLanguageFromPath(path: string): SupportedLanguage | null {
  const segments = path.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    return null;
  }
  
  const firstSegment = segments[0];
  
  if (isValidLanguage(firstSegment)) {
    return firstSegment;
  }
  
  return null;
}
```

**功能**:
- 从 URL 路径的第一段提取语言代码
- 例如: `/en/issues` → `en`, `/zh-CN/tags` → `zh-CN`
- 如果第一段不是有效语言，返回 `null`

### 2. 从 Cookie 获取语言 (`getLanguageFromCookie`)

**文件**: `src/lib/i18n-utils.ts`

```typescript
export function getLanguageFromCookie(request: NextRequest): SupportedLanguage | null {
  const langCookie = request.cookies.get('language');
  
  if (langCookie && isValidLanguage(langCookie.value)) {
    return langCookie.value;
  }
  
  return null;
}
```

**功能**:
- 从请求的 Cookie 中读取 `language` 值
- 验证是否为有效语言代码
- Cookie 有效期: 1年

### 3. 从浏览器语言检测 (`getDefaultLanguage`)

**文件**: `src/lib/i18n-utils.ts`

```typescript
export function getDefaultLanguage(request: NextRequest): SupportedLanguage {
  const acceptLanguage = request.headers.get('accept-language');
  
  if (acceptLanguage) {
    // 解析 Accept-Language header
    // 格式: "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7"
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [code, q = '1'] = lang.trim().split(';q=');
        return {
          code: code.toLowerCase().split('-')[0], // 只取主语言代码
          quality: parseFloat(q),
        };
      })
      .sort((a, b) => b.quality - a.quality);
    
    // 检查是否有中文
    for (const lang of languages) {
      if (lang.code === 'zh') {
        return 'zh-CN';
      }
    }
    
    // 检查是否有英文
    for (const lang of languages) {
      if (lang.code === 'en') {
        return 'en';
      }
    }
  }
  
  return DEFAULT_LANGUAGE;
}
```

**功能**:
- 解析 `Accept-Language` HTTP header
- 按质量值（q-value）排序
- 优先匹配中文，其次英文
- 如果都不匹配，返回默认语言

### 4. 综合语言检测 (`detectLanguage`)

**文件**: `src/lib/i18n-utils.ts`

```typescript
export function detectLanguage(
  request: NextRequest,
  pathname: string
): SupportedLanguage {
  // 1. 首先检查 URL 路径中是否有语言前缀
  const langFromPath = getLanguageFromPath(pathname);
  if (langFromPath) {
    return langFromPath;
  }
  
  // 2. 检查 cookie
  const langFromCookie = getLanguageFromCookie(request);
  if (langFromCookie) {
    return langFromCookie;
  }
  
  // 3. 检查浏览器语言
  const langFromBrowser = getDefaultLanguage(request);
  if (langFromBrowser) {
    return langFromBrowser;
  }
  
  // 4. 默认返回中文
  return DEFAULT_LANGUAGE;
}
```

**功能**:
- 综合所有检测方式
- 按优先级返回语言代码
- 确保始终返回有效语言

## 🎯 语言判断机制

### 1. 语言验证 (`isValidLanguage`)

**文件**: `src/lib/i18n-utils.ts`

```typescript
export const SUPPORTED_LANGUAGES = ['en', 'zh-CN'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export function isValidLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
}
```

**功能**:
- 验证语言代码是否在支持列表中
- 支持的语言: `en` (英文), `zh-CN` (中文)
- 使用 TypeScript 类型守卫确保类型安全

### 2. 路径语言操作

#### 添加语言前缀 (`addLanguageToPath`)

```typescript
export function addLanguageToPath(path: string, lang: SupportedLanguage): string {
  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  
  if (normalizedPath === '/') {
    return `/${lang}`;
  }
  
  const pathWithoutLang = removeLanguageFromPath(normalizedPath);
  
  if (pathWithoutLang === '/') {
    return `/${lang}`;
  }
  
  return `/${lang}${pathWithoutLang}`;
}
```

**示例**:
- `/issues` + `en` → `/en/issues`
- `/tags/ai` + `zh-CN` → `/zh-CN/tags/ai`
- `/` + `en` → `/en`

#### 移除语言前缀 (`removeLanguageFromPath`)

```typescript
export function removeLanguageFromPath(path: string): string {
  const segments = path.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    return '/';
  }
  
  const firstSegment = segments[0];
  
  if (isValidLanguage(firstSegment)) {
    const remainingPath = '/' + segments.slice(1).join('/');
    return remainingPath === '/' ? '/' : remainingPath;
  }
  
  return path.startsWith('/') ? path : '/' + path;
}
```

**示例**:
- `/en/issues` → `/issues`
- `/zh-CN/tags/ai` → `/tags/ai`
- `/en` → `/`

#### 切换路径语言 (`switchLanguageInPath`)

```typescript
export function switchLanguageInPath(path: string, newLang: SupportedLanguage): string {
  const pathWithoutLang = removeLanguageFromPath(path);
  return addLanguageToPath(pathWithoutLang, newLang);
}
```

**示例**:
- `/en/issues` + `zh-CN` → `/zh-CN/issues`
- `/zh-CN/tags` + `en` → `/en/tags`

## 📱 客户端 Hook

### useCurrentLanguage Hook

**文件**: `src/hooks/use-current-language.ts`

```typescript
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
```

**功能**:
- 在客户端组件中获取当前语言
- 优先从 URL 参数获取（`[lang]` 路由段）
- 其次从 i18n 实例获取
- 兼容旧的 `zh` 值，自动转换为 `zh-CN`

## 🌐 路由结构

### 动态语言路由

**文件**: `src/app/[lang]/layout.tsx`

```typescript
export async function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((lang) => ({
    lang,
  }));
}
```

**路由结构**:
- `/[lang]/` - 首页
- `/[lang]/issues` - 期刊列表
- `/[lang]/issues/[slug]` - 期刊详情
- `/[lang]/tags` - 标签列表
- `/[lang]/tags/[tag]` - 标签页面

**语言验证**:
```typescript
export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;
  
  // 验证语言参数
  if (!isValidLanguage(lang)) {
    notFound();
  }
  
  return <>{children}</>;
}
```

## 🔄 语言切换流程

### LanguageSwitcher 组件

**文件**: `src/components/LanguageSwitcher.tsx`

```typescript
const toggleLanguage = () => {
  const newLang: SupportedLanguage = currentLang === 'en' ? 'zh-CN' : 'en';
  
  // 1. 更新 i18n
  i18n.changeLanguage(newLang);
  
  // 2. 更新 localStorage
  localStorage.setItem('language', newLang);
  
  // 3. 切换 URL 路径中的语言
  const newPath = switchLanguageInPath(pathname, newLang);
  router.push(newPath);
};
```

**切换步骤**:
1. 确定新语言（在 `en` 和 `zh-CN` 之间切换）
2. 更新 i18n 实例的语言
3. 更新 localStorage
4. 切换 URL 路径中的语言前缀
5. 导航到新 URL（触发 middleware，设置 Cookie）

## 📊 语言存储位置

### 1. URL 路径（主要）
- **位置**: URL 的第一段路径
- **格式**: `/{lang}/...`
- **示例**: `/en/issues`, `/zh-CN/tags`
- **持久性**: 永久（URL 的一部分）

### 2. Cookie（服务端）
- **键名**: `language`
- **值**: `en` 或 `zh-CN`
- **有效期**: 1年
- **作用域**: `/`
- **设置位置**: Middleware

### 3. localStorage（客户端）
- **键名**: `language`
- **值**: `en` 或 `zh-CN`
- **持久性**: 浏览器会话之间
- **设置位置**: i18n.ts 和 LanguageSwitcher

## 🎯 语言文件加载

### 翻译资源结构

**文件**: `src/lib/i18n.ts`

```typescript
import { en } from './locales/en';
import { zh_CN } from './locales/zh_CN';

const resources = {
  en,
  'zh-CN': zh_CN,
};
```

### 翻译文件位置

- **英文**: `src/lib/locales/en.ts`
- **中文**: `src/lib/locales/zh_CN.ts`

### 翻译文件格式

```typescript
// src/lib/locales/en.ts
export const en = {
  translation: {
    // 翻译键值对
  }
};

// src/lib/locales/zh_CN.ts
export const zh_CN = {
  translation: {
    // 翻译键值对
  }
};
```

### i18n 初始化

```typescript
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
      useSuspense: false, // Next.js 中禁用 Suspense
    },
  });
```

## 🔍 完整流程图

```
用户访问网站
    ↓
Middleware 拦截请求
    ↓
检查路径是否有语言前缀？
    ├─ 是 → 设置 Cookie → 继续
    └─ 否 → 检测语言
            ├─ URL 路径？
            ├─ Cookie？
            ├─ 浏览器语言？
            └─ 默认语言 (zh-CN)
        ↓
    添加语言前缀到路径
        ↓
    设置 Cookie
        ↓
    重定向到新 URL
        ↓
页面加载
    ↓
客户端 i18n 初始化
    ↓
detectUserLanguage()
    ├─ URL 路径？
    ├─ localStorage？
    ├─ 浏览器语言？
    └─ 默认语言 (zh-CN)
    ↓
加载对应语言的翻译文件
    ↓
组件使用翻译
```

## 📝 关键要点总结

1. **URL 优先**: URL 路径中的语言前缀是最高优先级
2. **自动重定向**: 没有语言前缀的 URL 会自动重定向到带语言前缀的版本
3. **多存储**: 语言偏好存储在 Cookie、localStorage 和 URL 中
4. **服务端 + 客户端**: 服务端（Middleware）和客户端（i18n）都有检测逻辑
5. **类型安全**: 使用 TypeScript 类型守卫确保语言代码有效性
6. **向后兼容**: 兼容旧的 `zh` 值，自动转换为 `zh-CN`
7. **SEO 友好**: 所有页面都有语言前缀，支持多语言 SEO

## 🔧 使用示例

### 在服务端组件中获取语言

```typescript
// src/app/[lang]/page.tsx
export default async function Home({ params }: HomePageProps) {
  const { lang } = await params;
  
  if (!isValidLanguage(lang)) {
    notFound();
  }
  
  const t = translations[lang];
  // 使用翻译...
}
```

### 在客户端组件中获取语言

```typescript
// src/components/SomeComponent.tsx
"use client";

import { useCurrentLanguage } from "@/hooks/use-current-language";
import { useTranslation } from "react-i18next";

export function SomeComponent() {
  const lang = useCurrentLanguage();
  const { t } = useTranslation();
  
  // 使用翻译...
}
```

### 切换语言

```typescript
import { switchLanguageInPath } from "@/lib/i18n-utils";
import { useRouter, usePathname } from "next/navigation";

const router = useRouter();
const pathname = usePathname();
const newPath = switchLanguageInPath(pathname, 'en');
router.push(newPath);
```

---

**文档状态**: ✅ 完整  
**最后更新**: 2025-01-XX

