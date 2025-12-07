import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  detectLanguage,
  getLanguageFromPath,
  addLanguageToPath,
  isValidLanguage,
  DEFAULT_LANGUAGE,
} from '@/lib/i18n-utils';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // 检查是否是 ai.snapallx.com 域名，重定向到主域名
  if (hostname === 'ai.snapallx.com' || hostname.startsWith('ai.snapallx.com:')) {
    const url = request.nextUrl.clone();
    url.hostname = 'www.snapallx.com';
    return NextResponse.redirect(url);
  }
  
  // 跳过 API 路由、静态资源和 Next.js 内部路径
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap')
  ) {
    return NextResponse.next();
  }
  
  // 检查路径中是否已有语言前缀
  const langFromPath = getLanguageFromPath(pathname);
  
  if (langFromPath) {
    // 路径中已有语言前缀，设置 cookie 并继续
    const response = NextResponse.next();
    response.cookies.set('language', langFromPath, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1年
      sameSite: 'lax',
    });
    return response;
  }
  
  // 路径中没有语言前缀，需要添加
  // 检测应该使用的语言
  const detectedLang = detectLanguage(request, pathname);
  
  // 构建新的 URL，添加语言前缀
  const newPathname = addLanguageToPath(pathname, detectedLang);
  const url = request.nextUrl.clone();
  url.pathname = newPathname;
  
  // 重定向到带语言前缀的 URL
  const response = NextResponse.redirect(url);
  
  // 设置语言 cookie
  response.cookies.set('language', detectedLang, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1年
    sameSite: 'lax',
  });
  
  return response;
}

// 配置代理匹配规则
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt, sitemap.xml 等静态文件
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap).*)',
  ],
};

