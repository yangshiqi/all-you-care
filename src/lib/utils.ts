import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 生成绝对 URL
 * @param path - 相对路径（例如："/x_welcome.jpg"）
 * @returns 完整的绝对 URL
 */
export function getAbsoluteUrl(path: string): string {
  // 如果已经是绝对 URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snapallx.com';
  // 确保 path 以 / 开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // 确保 baseUrl 不以 / 结尾
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBaseUrl}${normalizedPath}`;
}
