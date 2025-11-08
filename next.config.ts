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
  }
};

export default nextConfig;
