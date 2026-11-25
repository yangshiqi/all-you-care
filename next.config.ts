import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Retired tag archives: send old bookmarks to the issue archive
    // before Proxy or application rendering. Keep the locale on localized URLs.
    return [
      {
        source: '/:lang(en|zh-CN)/tags/:path*',
        destination: '/:lang/issues',
        permanent: false,
      },
      {
        source: '/tags/:path*',
        destination: '/issues',
        permanent: false,
      },
    ];
  },
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
