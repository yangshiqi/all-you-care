import { notFound } from "next/navigation";

// 这个 catch-all 路由用于捕获所有未匹配的路径
// 例如：/en/en121, /en/any-invalid-path 等
export default function CatchAll() {
  notFound();
}

