"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import "@/lib/i18n";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  // 所有 Provider 都是 SSR 安全的，服务端与客户端都渲染，避免挂载后再切换导致的水合问题。
  // ThemeProvider 在服务端渲染让它的 no-flash 脚本进入初始 HTML（避免主题闪烁 + React 19 script 告警）；
  // <html suppressHydrationWarning> 已处理主题 class 的差异。
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          {children}
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
