import type { NextRequest } from 'next/server';

// 支持的语言列表
export const SUPPORTED_LANGUAGES = ['en', 'zh-CN'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// 默认语言
export const DEFAULT_LANGUAGE: SupportedLanguage = 'zh-CN';

/**
 * 验证语言代码是否有效
 */
export function isValidLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
}

/**
 * 从路径中提取语言代码
 * @param path - URL 路径，例如 "/en/issues" 或 "/zh-CN/tags"
 * @returns 语言代码或 null
 */
export function getLanguageFromPath(path: string): SupportedLanguage | null {
  // 移除开头的斜杠并分割路径
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

/**
 * 从路径中移除语言前缀
 * @param path - 包含语言前缀的路径，例如 "/en/issues"
 * @returns 移除语言前缀后的路径，例如 "/issues"
 */
export function removeLanguageFromPath(path: string): string {
  const segments = path.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    return '/';
  }
  
  const firstSegment = segments[0];
  
  if (isValidLanguage(firstSegment)) {
    // 移除语言前缀
    const remainingPath = '/' + segments.slice(1).join('/');
    return remainingPath === '/' ? '/' : remainingPath;
  }
  
  return path.startsWith('/') ? path : '/' + path;
}

/**
 * 为路径添加语言前缀
 * @param path - 原始路径，例如 "/issues" 或 "issues"
 * @param lang - 语言代码
 * @returns 带语言前缀的路径，例如 "/en/issues"
 */
export function addLanguageToPath(path: string, lang: SupportedLanguage): string {
  // 确保路径以 / 开头
  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  
  // 如果路径已经是根路径，直接返回语言路径
  if (normalizedPath === '/') {
    return `/${lang}`;
  }
  
  // 移除路径中可能已存在的语言前缀
  const pathWithoutLang = removeLanguageFromPath(normalizedPath);
  
  // 如果移除语言后是根路径，返回语言根路径
  if (pathWithoutLang === '/') {
    return `/${lang}`;
  }
  
  return `/${lang}${pathWithoutLang}`;
}

/**
 * 切换路径的语言
 * @param path - 当前路径，例如 "/en/issues"
 * @param newLang - 新语言代码
 * @returns 切换语言后的路径，例如 "/zh-CN/issues"
 */
export function switchLanguageInPath(path: string, newLang: SupportedLanguage): string {
  const pathWithoutLang = removeLanguageFromPath(path);
  return addLanguageToPath(pathWithoutLang, newLang);
}

/**
 * 从请求头检测默认语言
 * 优先级：Accept-Language header > 默认中文
 * @param request - Next.js 请求对象
 * @returns 检测到的语言代码
 */
export function getDefaultLanguage(request: NextRequest): SupportedLanguage {
  // 检查 Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  
  if (acceptLanguage) {
    // 解析 Accept-Language header
    // 格式通常是 "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7"
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
  
  // 默认返回中文
  return DEFAULT_LANGUAGE;
}

/**
 * 从 cookie 获取语言偏好
 * @param request - Next.js 请求对象
 * @returns 语言代码或 null
 */
export function getLanguageFromCookie(request: NextRequest): SupportedLanguage | null {
  const langCookie = request.cookies.get('language');
  
  if (langCookie && isValidLanguage(langCookie.value)) {
    return langCookie.value;
  }
  
  return null;
}

/**
 * 检测应该使用的语言
 * 优先级：URL 路径 > Cookie > 浏览器语言 > 默认语言
 * @param request - Next.js 请求对象
 * @param pathname - 当前路径
 * @returns 检测到的语言代码
 */
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

