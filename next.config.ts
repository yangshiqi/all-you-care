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
        hostname: 'lovable.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // 压缩配置
  compress: true,
  // 生产环境优化
  poweredByHeader: false,
  // Turbopack 根目录配置
  turbopack: {
    root: '/Users/ysq/Work/all-you-care',
  },
};

export default nextConfig;
