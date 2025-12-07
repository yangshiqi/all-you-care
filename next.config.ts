import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 服务器外部包配置
  serverExternalPackages: ['i18next'],
  // 图片优化配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'snapallx.com',
        port: '',
        pathname: '/**',
      }
    ]
  },
  // Turbopack 配置：明确指定项目根目录，避免检测到父目录的 lockfile
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
