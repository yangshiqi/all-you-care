import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  detectLanguage,
  getLanguageFromPath,
  addLanguageToPath,
} from '@/lib/i18n-utils';

// Admin auth constants
const ADMIN_COOKIE_NAME = 'admin_token';
const ADMIN_PROTECTED_PREFIX = '/admin';
const ADMIN_LOGIN_PATH = '/admin/login';
const ADMIN_LOGIN_API = '/api/admin/login';

function adminAuthCheck(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const isAdminPath =
    pathname.startsWith(ADMIN_PROTECTED_PREFIX) || pathname.startsWith('/api/admin/');
  if (!isAdminPath) return null;

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: 'admin disabled' }, { status: 503 });
  }

  const requiresAuth =
    (pathname.startsWith(ADMIN_PROTECTED_PREFIX) && pathname !== ADMIN_LOGIN_PATH) ||
    (pathname.startsWith('/api/admin/') && pathname !== ADMIN_LOGIN_API);

  if (!requiresAuth) return NextResponse.next();

  const got = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (got === adminToken) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = ADMIN_LOGIN_PATH;
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 检查是否是 ai.snapallx.com 域名，重定向到主域名
  if (hostname === 'ai.snapallx.com' || hostname.startsWith('ai.snapallx.com:')) {
    const url = request.nextUrl.clone();
    url.hostname = 'www.snapallx.com';
    return NextResponse.redirect(url);
  }

  // Admin auth: handle /admin/* and /api/admin/* before other routing
  const adminResp = adminAuthCheck(request);
  if (adminResp) return adminResp;

  // 静态文件扩展名列表（public 目录下的文件）
  const staticFileExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico',
    '.pdf', '.txt', '.xml', '.json', '.css', '.js', '.woff', '.woff2', '.ttf', '.eot'
  ];

  // 检查是否是静态文件（通过文件扩展名判断）
  const isStaticFile = staticFileExtensions.some(ext => pathname.toLowerCase().endsWith(ext));

  // 跳过 API 路由、静态资源和 Next.js 内部路径
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/sitemap') ||
    pathname.startsWith('/ainews/') ||
    isStaticFile  // 跳过静态文件（public 目录下的文件）
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
     * - ainews/ (静态图片资源目录)
     * - 静态文件扩展名（.jpg, .png, .svg 等）- 在 proxy 函数中通过扩展名检测处理
     * 注意：public 目录下的文件通过根路径直接访问（如 /welcome.jpg），在 proxy 函数中通过文件扩展名检测跳过
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap|ainews).*)',
    // Admin API routes still need to hit the proxy for ADMIN_TOKEN auth
    '/api/admin/:path*',
  ],
};

