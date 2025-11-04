import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 服务器外部包配置
  serverExternalPackages: ['i18next'],
  // 静态导出配置
  output: 'export',
  trailingSlash: true,
  // 图片优化（静态导出时禁用优化）
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'allyoucare.ai',
        port: '',
        pathname: '/**',
      }
    ]
  }
};

export default nextConfig;
