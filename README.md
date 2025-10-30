# AINews - AI工程师每日资讯精选

一个现代化的AI新闻聚合平台，采用Next.js 16服务端渲染(SSR)技术，为AI工程师提供每日精选的AI资讯。

## ✨ 特性

- 🚀 **服务端渲染(SSR)**: 完全支持SEO优化，搜索引擎友好
- 🌍 **多语言支持**: 中英文界面切换
- 📱 **响应式设计**: 完美适配移动端和桌面端
- 🎨 **复古报纸风格**: 独特的视觉设计体验
- ⚡ **高性能**: Next.js 16 + React 19 最新技术栈
- 🔍 **SEO优化**: 完整的meta标签、Open Graph、Twitter Card支持

## 🛠️ 技术栈

- **框架**: Next.js 16 (App Router)
- **前端**: React 19, TypeScript
- **样式**: Tailwind CSS, shadcn/ui
- **国际化**: react-i18next
- **状态管理**: TanStack Query
- **表单**: React Hook Form + Zod
- **主题**: next-themes

## 🚀 快速开始

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
# 或
bun install
```

### 启动开发服务器

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
# 或
bun dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

### 构建生产版本

```bash
npm run build
npm run start
```

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   ├── providers.tsx      # 客户端提供者
│   ├── issues/            # 期刊相关页面
│   │   ├── page.tsx       # 期刊列表页
│   │   └── [slug]/        # 动态期刊详情页
│   └── test/              # 测试页面
├── components/            # React组件
│   ├── ui/               # shadcn/ui基础组件
│   ├── Header.tsx        # 页面头部
│   ├── Hero.tsx          # 首页英雄区
│   ├── RecentIssues.tsx  # 最近期刊
│   └── ...               # 其他组件
├── lib/                  # 工具库
│   ├── i18n.ts          # 国际化配置
│   └── utils.ts         # 工具函数
└── hooks/               # 自定义Hooks
```

## 🌐 页面路由

- `/` - 首页
- `/issues` - 期刊列表页
- `/issues/[slug]` - 期刊详情页
- `/issues-demo` - 期刊演示页面
- `/test` - SSR测试页面

## 🔧 开发指南

### 添加新期刊

在 `src/app/issues/[slug]/page.tsx` 中的 `getIssueData` 函数里添加新的期刊数据：

```typescript
const issues = {
  "2024-12-20": {
    title: "新期刊标题",
    date: "2024-12-20",
    summary: "期刊摘要",
    // ... 其他数据
  },
  // ... 现有期刊
};
```

### 自定义样式

项目使用Tailwind CSS，自定义样式在 `src/app/globals.css` 中定义。

### 国际化

翻译文件在 `src/lib/i18n.ts` 中管理，支持中英文切换。

## 📈 SEO优化

- ✅ 服务端渲染(SSR)
- ✅ 动态meta标签生成
- ✅ Open Graph支持
- ✅ Twitter Card支持
- ✅ 结构化数据
- ✅ 多语言hreflang
- ✅ 搜索引擎友好的URL结构

## 🚀 部署

### Vercel部署

1. 将代码推送到GitHub
2. 在Vercel中导入项目
3. 自动部署完成

### 其他平台

```bash
npm run build
npm run start
```

## 📝 更新日志

查看 [changelog.md](./changelog.md) 了解详细更新记录。

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License