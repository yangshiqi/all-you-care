"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import "@/lib/i18n";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ThemeProvider 必须在服务端也渲染，这样它的 no-flash 脚本会出现在初始 HTML 里
  // （脚本在 hydration 前运行，避免主题闪烁，也避免 React 19 “在客户端渲染 script 标签” 的告警）。
  // 数据相关的 Provider 仍延迟到挂载后，以保持服务端/首个客户端渲染结构一致（i18n 水合安全）。
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {mounted ? (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Sonner />
            {children}
          </TooltipProvider>
        </QueryClientProvider>
      ) : (
        children
      )}
    </ThemeProvider>
  );
}
