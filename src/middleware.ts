import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // 检查是否是 ai.snapallx.com 域名
  if (hostname === 'ai.snapallx.com' || hostname.startsWith('ai.snapallx.com:')) {
    // 重定向到首页
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

// 配置中间件匹配规则
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

