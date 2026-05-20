# SnapAI News

> 不要让算法决定你看到什么。

互联网充斥着 PR 通稿和 AI 生成的垃圾。SnapAI 是一台**去噪引擎**，每天把多个信号源压缩成一份 **5 分钟能读完的中文日报**：

- **25+ 个手工精选的 RSS** —— 36kr / TechCrunch / The Verge / MIT Tech Review / a16z / PitchBook 等
- **跟着 HN 的口味动态扩展** —— 通过 OPML 实时拉取 [`emschwartz/hn-popular-blogs-2025`](https://github.com/emschwartz)，Hacker News 在追的博客我们自动跟进，**无需手动维护源列表**
- **十多个开发者 newsletter** —— 站长本人订阅 / 维护的邮箱

LLM 多步流水线接力：抓取 → 压缩 → 打分 → 合并 → 渲染。我们不生产新闻，**我们反编译真相**。

**[读今天的日报 →](https://snapallx.com)** · [订阅](https://snapallx.com/subscribe) · [已有 2,937+ 工程师接入](https://snapallx.com/subscribe)

---

仓库布局：上层是前端（Next.js + Supabase），[`pipeline/`](./pipeline) 是独立子项目（TypeScript 内容流水线，跑在 GitHub Actions 上）。

## 技术栈

**前端**
- Next.js 16（App Router）+ React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui（Radix Primitives）
- TanStack Query / next-themes / motion / sonner
- react-i18next（zh-CN / en 双语）

**数据 & 服务**
- Supabase（Postgres + RLS）—— 唯一持久层
- HubSpot —— 邮件订阅
- Vercel —— 部署

**内容流水线**（详见 [`pipeline/README.md`](./pipeline/README.md)）
- TypeScript + tsx，运行在 GitHub Actions cron
- Anthropic Claude（compress / score / merge / render）
- Gmail IMAP（邮件源 + 头图抽取）
- RSS / OPML / 邮件 三类数据源

## 快速开始

```bash
# 1. 装依赖
npm install

# 2. 配 .env.local
cp .env.example .env.local   # 然后填 SUPABASE / HUBSPOT key

# 3. 启动 dev server（端口 1717）
npm run dev
```

打开 <http://localhost:1717> 即可。

### 环境变量

```bash
# Supabase（必需）
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# 服务端（API routes 用）
SUPABASE_SERVICE_ROLE_KEY=...

# HubSpot 邮件订阅（可选）
HUBSPOT_ACCESS_TOKEN=...

# 后台接口鉴权
ADMIN_TOKEN=...

# sitemap / canonical URL（可选）
NEXT_PUBLIC_SITE_URL=https://snapallx.com
```

## 路由

| 路径 | 说明 |
|---|---|
| `/[lang]/` | 首页：最新一期 + 历史卡片 |
| `/[lang]/issues` | 期刊分页列表 |
| `/[lang]/issues/[slug]` | 期刊详情（slug = `journal_id`）|
| `/[lang]/tags` | 标签总览 |
| `/[lang]/tags/[tag]` | 单标签下的期刊 |
| `/[lang]/blog` | 长文 blog（内部隐藏入口）|
| `/[lang]/subscribe` | 邮件订阅 |
| `/admin` | 管理后台（token 鉴权）|

`[lang]` 支持 `zh-CN` / `en`，根 `/` 会按浏览器 `Accept-Language` 重定向。

### API

| 路径 | 用途 |
|---|---|
| `POST /api/subscribe` | HubSpot 订阅 |
| `POST /api/send-campaign-email` | 后台广播 |
| `POST /api/send-latest-ai-news` | 给订阅者发当期日报 |
| `GET  /api/check-email-status` | 投递状态轮询 |
| `* /api/admin/*` | 后台操作（手动触发 deliver、置顶 issue 等）|

## 项目结构

```
all-you-care/
├── src/
│   ├── app/
│   │   ├── [lang]/             # i18n 路由
│   │   │   ├── issues/         # 期刊列表 / 详情
│   │   │   ├── tags/           # 标签
│   │   │   ├── subscribe/      # 订阅页
│   │   │   └── layout.tsx
│   │   ├── admin/              # 后台
│   │   ├── api/                # API routes
│   │   ├── sitemap.ts          # 动态 sitemap
│   │   └── providers.tsx       # Query / Theme / i18n providers
│   ├── components/             # UI 组件（Header, IssuesList, ...）
│   │   └── ui/                 # shadcn/ui 原语
│   └── lib/
│       ├── api.ts              # Supabase 查询（所有取数走这里）
│       ├── supabase.ts         # client 实例
│       ├── i18n.ts             # 翻译字典
│       └── i18n-utils.ts
├── pipeline/                   # ← 独立子项目，内容流水线
└── .github/workflows/          # 调度（每条流水线对应一个 .yml）
```

## 数据流

```
                       ┌────────────────────────────┐
                       │  GitHub Actions cron       │
                       │  (.github/workflows/*.yml) │
                       └─────────────┬──────────────┘
                                     │
                       ┌─────────────▼──────────────┐
                       │  pipeline/  (npm run cli)  │
                       │                            │
                       │  fetch → compress → score  │
                       │     → merge → render       │
                       │     → publish (+ tags,     │
                       │     reutersImage, deliver) │
                       └─────────────┬──────────────┘
                                     │
                              writes ▼
                       ┌────────────────────────────┐
                       │     Supabase Postgres      │
                       └─────────────┬──────────────┘
                                     │  reads
                       ┌─────────────▼──────────────┐
                       │   Next.js (this repo)      │
                       │   src/lib/api.ts           │
                       └────────────────────────────┘
```

前端从来不直接调 LLM 或 RSS —— 所有内容生成都在 pipeline 完成后落库，前端只做 SSR + 静态化。

## 部署

主分支推送即触发 Vercel 自动部署。

- 生产：`main`
- 预览：任意 PR

环境变量在 Vercel Project Settings 配置；GitHub Actions 用到的密钥单独在仓库 Settings → Secrets and variables → Actions 里。

## 文档

- [`pipeline/README.md`](./pipeline/README.md) —— 流水线设计、各步骤、本地调试
- [`docs/superpowers/specs/2026-05-13-n8n-to-pipeline-design.md`](./docs/superpowers/specs/2026-05-13-n8n-to-pipeline-design.md) —— pipeline 完整设计文档
- [`CLAUDE.md`](./CLAUDE.md) —— 给 Claude Code 的项目说明
- [`changelog.md`](./changelog.md) —— 更新记录

## License

[AGPL-3.0-or-later](./LICENSE)。简单说：

- 自己用、改、内部跑 —— 自由
- 跑成对外服务（SaaS / 网站） —— 必须把你的改动也按 AGPL 开源
- 不想被这条约束 —— 可联系作者获取商业授权
