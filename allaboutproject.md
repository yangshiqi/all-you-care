# AINews 项目全貌分析

**最后更新**: 2025年1月XX日  
**项目状态**: ✅ 生产就绪 (SSR版本)

## 🎯 项目概述

AINews是一个现代化的行业资讯聚合平台，以打破每个人的信息茧房为目标，收集行业内的新闻，帮助大家压缩信息、节省时间、缓解焦虑。项目采用Next.js 16服务端渲染(SSR)架构，确保优秀的SEO表现和用户体验。

## 🏗️ 技术架构

### 核心技术栈
- **框架**: Next.js 16 (App Router)
- **前端**: React 19 + TypeScript
- **样式**: Tailwind CSS + shadcn/ui
- **国际化**: react-i18next
- **状态管理**: TanStack Query
- **表单处理**: React Hook Form + Zod
- **主题系统**: next-themes

### 项目结构
```
ainews/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # 根布局 (SSR)
│   │   ├── page.tsx           # 首页 (SSR)
│   │   ├── providers.tsx      # 客户端提供者
│   │   ├── issues/            # 期刊相关页面
│   │   │   ├── page.tsx       # 期刊列表页 (SSR)
│   │   │   └── [slug]/        # 动态期刊详情页 (SSR)
│   │   ├── issues-demo/       # 期刊演示页面 (SSR)
│   │   └── test/              # SSR测试页面 (SSR)
│   ├── components/            # React组件
│   │   ├── ui/               # shadcn/ui基础组件
│   │   ├── Header.tsx        # 页面头部 (客户端)
│   │   ├── Hero.tsx          # 首页英雄区 (客户端)
│   │   ├── RecentIssues.tsx  # 最近期刊 (客户端)
│   │   ├── IssueDetailContent.tsx # 期刊详情内容 (客户端)
│   │   └── LanguageSwitcher.tsx   # 语言切换 (客户端)
│   ├── lib/                  # 工具库
│   │   ├── i18n.ts          # 国际化配置
│   │   └── utils.ts         # 工具函数
│   └── hooks/               # 自定义Hooks
├── public/                   # 静态资源
├── ai-docs/                 # 项目文档
└── 配置文件...
```

## 🌐 页面路由系统

### 路由配置
- **首页**: `/` - 展示最新AI资讯和订阅功能
- **期刊列表**: `/issues` - 所有期刊的列表页面（支持分页，URL格式：`/issues?page=N`）
- **期刊详情**: `/issues/[slug]` - 动态期刊详情页
- **演示页面**: `/issues-demo` - 期刊访问演示
- **测试页面**: `/test` - SSR功能测试
- **标签列表**: `/tags` - 所有标签列表页面（包含标签使用统计）
- **标签页面**: `/tags/[tag]` - 按标签筛选展示内容（支持SEO元数据）
- **订阅成功页**: `/subscribe/success` - 订阅成功提示页面（支持激活状态）
- **SNOW订阅页**: `/subscribe/snow` - SNOW新闻订阅页面（简洁设计风格）

### 静态文件访问
- **文件存放**: 所有静态文件（图片、字体、图标等）应放在 `public/` 目录下
- **URL 访问**: 通过根路径直接访问，**不需要** `/public/` 前缀
  - ✅ 正确：`/welcome.jpg` → 访问 `public/welcome.jpg`
  - ✅ 正确：`/x_welcome.jpg` → 访问 `public/x_welcome.jpg`
  - ❌ 错误：`/public/welcome.jpg`（这不是 Next.js 标准用法）
- **Next.js 标准**: 这是 Next.js 的官方推荐做法，`public/` 目录下的文件会自动映射到网站根路径
- **代码示例**: 
  ```tsx
  // ✅ 正确用法
  <img src="/welcome.jpg" alt="Welcome" />
  <Image src="/x_welcome.jpg" alt="Welcome" width={1200} height={630} />
  
  // ❌ 错误用法（不要使用）
  <img src="/public/welcome.jpg" alt="Welcome" />
  ```

### 域名重定向
- **重定向规则**: 访问 `ai.snapallx.com` 时自动重定向到首页
- **实现方式**: 使用 Next.js 代理 (`src/proxy.ts`) 处理域名重定向
- **匹配规则**: 匹配所有路径（排除 API 路由、静态资源和 `/public/*` 路径）
- **SEO友好**: 使用标准 HTTP 重定向，搜索引擎正确处理

### 动态路由处理
```typescript
// src/app/issues/[slug]/page.tsx
interface IssueDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { slug } = await params; // Next.js 16 需要 await
  const issue = await getIssueData(slug);
  // ...
}
```

## 🎨 设计系统

### 视觉风格
- **复古报纸风格**: 采用报纸排版和配色方案
- **现代交互**: 流畅的动画和过渡效果
- **响应式设计**: 完美适配各种屏幕尺寸
- **多语言支持**: 中英文界面无缝切换

### 样式配置
- **Tailwind CSS**: 原子化CSS框架
- **shadcn/ui**: 高质量组件库
- **自定义主题**: 复古风格的配色方案
- **字体系统**: Inter + EB Garamond + Courier Prime

## 🔍 SEO优化策略

### 服务端渲染(SSR)
- **完全SSR**: 所有页面在服务端预渲染
- **HTML完整**: 搜索引擎可获取完整内容
- **快速加载**: 首屏内容立即可见

### 元数据优化
```typescript
// 动态元数据生成
export async function generateMetadata({ params }: IssueDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const issue = await getIssueData(slug);
  
  return {
    title: `${issue.title} | AINews`,
    description: issue.summary,
    openGraph: { /* Open Graph 数据 */ },
    twitter: { /* Twitter Card 数据 */ },
  };
}
```

### SEO特性
- ✅ 动态title和description
- ✅ Open Graph支持
- ✅ Twitter Card支持
- ✅ 多语言hreflang
- ✅ 结构化数据
- ✅ 搜索引擎友好的URL

## 🌍 国际化系统

### 语言支持
- **中文**: 默认语言
- **英语**: 完整翻译支持
- **自动检测**: 基于浏览器语言设置和 localStorage 偏好
- **手动切换**: 用户可随时切换语言

### 实现方式
```typescript
// src/lib/i18n.ts
const resources = {
  en: { translation: { /* 英文翻译 */ } },
  zh: { translation: { /* 中文翻译 */ } },
};

i18n.use(initReactI18next).init({
  resources,
  lng: detectUserLanguage(),
  fallbackLng: 'zh-CN', // 默认回退到中文
  react: { useSuspense: false }, // Next.js 兼容
});
```

## 📊 数据管理

### 数据库集成
- **Supabase**: 实时数据库和 API 服务
- **表结构**: `n8n-ai-contents` 表存储 AI 内容
- **字段映射**: id/title/content/summary/created_at
- **实时同步**: 支持实时数据更新

### 期刊数据结构
```typescript
// Supabase 原始数据
interface N8nAiContent {
  id: string;
  title: string;
  content: string;
  summary: string;
  created_at: string;
}

// 首页显示格式
interface IssueSummary {
  id: string;
  title: string;
  summary: string;
  date: string;
  tags: string[];
}
```

### 数据获取策略
- **服务端获取**: Issues 列表页使用服务端渲染(SSR)获取分页数据，提升 SEO 和首屏性能
- **客户端获取**: 首页等页面使用客户端数据获取，支持实时更新
- **分页支持**: Issues 列表页支持分页查询，默认每页 10 条记录
- **错误处理**: 自动降级到备用数据
- **加载状态**: 优雅的加载和错误提示
- **缓存机制**: 客户端缓存和 Next.js 缓存

## 🚀 性能优化

### Next.js优化
- **自动代码分割**: 按需加载组件
- **图片优化**: next/image自动优化
- **字体优化**: next/font自动加载
- **静态生成**: 静态资源预生成

### 用户体验
- **首屏快速**: SSR确保内容立即可见
- **渐进增强**: 客户端交互逐步加载
- **响应式**: 移动端和桌面端优化
- **无障碍**: 符合WCAG标准

## 🔧 开发工作流

### 开发环境
```bash
npm run dev    # 启动开发服务器
npm run build  # 构建生产版本
npm run start  # 启动生产服务器
npm run lint   # 代码检查
```

### 代码规范
- **TypeScript**: 严格类型检查
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **组件化**: 可复用的React组件

### API 使用规范 ⚠️ 重要
- **使用最新 API**: 必须使用官方推荐的最新 API 和方法
- **避免废弃方法**: 禁止使用官方已废弃（deprecated）或过时的方法
- **及时更新**: 当框架或库发布新版本时，及时检查并更新代码中的废弃 API
- **文档参考**: 在实现新功能前，查阅官方最新文档，确保使用推荐的 API
- **迁移指南**: 如果发现使用了废弃 API，参考官方迁移指南进行更新

#### Next.js 特定规范
- **中间件**: 使用 `src/proxy.ts` 而不是 `src/middleware.ts`（Next.js 已弃用 middleware.ts）
- **路由参数**: 使用 `await params` 处理动态路由参数（Next.js 16+）
- **元数据**: 使用 `generateMetadata` 函数生成页面元数据
- **静态生成**: 使用 `generateStaticParams` 进行静态页面生成

#### 检查清单
在提交代码前，确保：
- ✅ 没有使用任何废弃的 API 或方法
- ✅ 所有依赖包都是最新稳定版本
- ✅ 代码符合框架的最新最佳实践
- ✅ 没有控制台警告或废弃提示
- ✅ 参考了官方最新文档

## 📈 部署策略

### 生产环境
- **Vercel**: 推荐部署平台
- **服务端渲染**: 使用 Next.js SSR 架构
- **CDN**: 全球内容分发
- **HTTPS**: 自动SSL证书

### 环境配置
- **开发环境**: localhost:3000
- **预览环境**: Vercel Preview
- **生产环境**: 自定义域名

## 🎯 项目目标

### 短期目标
- ✅ 完成SSR架构迁移
- ✅ 实现SEO优化
- ✅ 多语言支持
- ✅ 响应式设计

### 长期目标
- ✅ 集成真实数据源 (Supabase)
- ✅ 用户订阅系统 (Brevo 集成)
- 🔄 内容管理系统
- 🔄 性能监控

## 📝 维护指南

### 添加新期刊
1. 在 `src/app/issues/[slug]/page.tsx` 的 `getIssueData` 函数中添加数据
2. 确保数据格式符合 `Issue` 接口
3. 测试页面渲染和SEO元数据

### 修改样式
1. 编辑 `src/app/globals.css` 修改全局样式
2. 使用Tailwind CSS类名修改组件样式
3. 更新 `tailwind.config.ts` 添加自定义配置

### 更新翻译
1. 编辑 `src/lib/i18n.ts` 中的翻译资源
2. 确保所有键值对都有对应的翻译
3. 测试语言切换功能

## 📧 Brevo 邮件订阅集成

### 功能特性
- **原生表单提交**: 使用 Brevo 原生表单，直接提交到 Brevo 服务器
- **自动化订阅**: 用户提交表单后自动添加到 Brevo 联系人列表
- **样式保留**: 保留网站原有的复古风格样式和 Tailwind CSS 类
- **多语言支持**: 根据当前语言自动设置 `locale` 字段（en/zh）
- **防机器人**: 使用 Brevo 的 `email_address_check` 隐藏字段防止机器人提交
- **加载状态**: 提交过程中显示加载状态，防止重复提交

### 表单结构
首页邮件订阅表单 (`src/components/Hero.tsx`) 使用 Brevo 原生表单：
- **表单 Action**: 直接 POST 到 Brevo 服务器
- **表单字段**:
  - `EMAIL` - 邮箱输入字段（必填）
  - `email_address_check` - 防机器人隐藏字段
  - `locale` - 语言设置（根据 i18n 自动设置：en/zh）
  - `html_type` - HTML 类型（固定为 simple）

### 表单配置
```html
<form 
  id="sib-form" 
  method="POST" 
  action="https://b55b2c6e.sibforms.com/serve/..."
  className="space-y-4 bg-card vintage-border p-6"
>
  <input 
    type="email" 
    id="EMAIL" 
    name="EMAIL" 
    required 
  />
  <input type="text" name="email_address_check" value="" style="display:none" />
  <input type="hidden" name="locale" value="en|zh" />
  <input type="hidden" name="html_type" value="simple" />
</form>
```

### 样式集成
表单保留了网站的所有样式类：
- `vintage-border` - 复古边框样式
- `bg-card` - 卡片背景
- `bg-background` - 输入框背景
- `border-2 border-border` - 边框样式
- 响应式布局和交互效果

### 后端 API（可选）
项目仍保留 `/api/subscribe` API 路由（`src/app/api/subscribe/route.ts`），可用于其他场景的订阅功能：
- **端点**: `/api/subscribe`
- **方法**: POST
- **说明**: 使用 Brevo Contacts API v3 创建或更新联系人

### 环境配置（仅后端 API 需要）
如果使用后端 API，需要在环境变量中配置 Brevo API 密钥和可选的列表 ID:
```bash
BREVO_API_KEY=your-brevo-api-key
BREVO_LIST_ID=your-list-id  # 可选，如果不设置则不添加到列表
```

### Brevo 表单设置
1. 登录 Brevo 账户（https://www.brevo.com/）
2. 导航至 "Forms" → "Forms"
3. 创建或编辑表单
4. 获取表单的 action URL
5. 配置表单的字段和样式
6. 设置成功/错误页面重定向

### 邮件确认模板
项目提供了定制化的双重确认邮件模板，与网站风格保持一致：

**模板文件**:
- `email-templates/double-optin-confirmation.html` - 英文版确认邮件
- `email-templates/double-optin-confirmation-zh.html` - 中文版确认邮件

**设计特点**:
- **品牌一致性**: 使用与网站相同的复古报纸风格和配色方案
- **配色方案**: 主色 #171717 (近黑色)，背景 #f5f5f5 (浅灰色)
- **字体系统**: Inter 字体作为主字体，Courier Prime 用于次要文本
- **响应式设计**: 邮件模板适配移动端和桌面端显示

**使用方法**:
1. 登录 Brevo 账户
2. 导航至 "Email" → "Templates" 或 "Campaigns" → "Double opt-in"
3. 创建或编辑双重确认邮件模板
4. 将对应的 HTML 代码复制到 Brevo 编辑器
5. 确保 `{{ doubleoptin }}` 变量正确设置（Brevo 会自动替换）

### 订阅成功页面
用户提交订阅表单后，会跳转到 `/subscribe/success` 页面。该页面支持两种状态：

#### 状态 1: 提交成功，待激活
当用户刚刚提交订阅表单时显示（默认状态，或 `status=pending`）：

**页面特性**:
- **邮箱图标**: 页面顶部显示邮箱图标，提醒用户检查邮箱
- **激活提示框**: 醒目的信息提示框，说明需要点击邮箱中的激活链接
- **流程说明**: 明确告知用户不激活将无法接收邮件
- **邮箱显示**: 如果 URL 中包含 `email` 参数，会显示注册的邮箱地址

**页面内容**:
- 标题：订阅成功提示
- 主要消息：已发送确认邮件，需要检查邮箱
- 激活提示：重要提示用户点击邮箱中的激活链接
- 额外信息：如果未收到邮件，建议检查垃圾邮件文件夹

#### 状态 2: 激活成功，订阅完成
当用户点击邮箱中的激活链接后显示（`status=activated` 或 `activated=true`）：

**页面特性**:
- **成功图标**: 页面顶部显示对勾图标，表示激活成功
- **成功提示框**: 绿色背景的成功提示框，庆祝订阅激活
- **欢迎信息**: 欢迎用户加入 AINews 社区
- **邮箱显示**: 如果 URL 中包含 `email` 参数，会显示已激活的邮箱地址

**页面内容**:
- 标题：订阅已激活！
- 主要消息：订阅已成功激活，将开始接收邮件
- 成功提示：感谢确认订阅，将开始接收每日AI新闻摘要
- 额外信息：如有问题或需要更新订阅偏好，可联系支持

**URL 参数**:
- `email`: 显示用户邮箱地址（可选）
- `status=activated` 或 `activated=true`: 标识为激活成功状态
- 无状态参数或 `status=pending`: 标识为待激活状态

**多语言支持**: 所有提示文本都支持中英文切换

### 使用说明
- **首页表单**: 直接使用 Brevo 原生表单，无需后端 API
- **其他场景**: 如需在其他地方集成订阅功能，可以使用 `/api/subscribe` API
- **多语言**: 表单的 `locale` 字段会根据当前 i18n 语言自动设置
- **样式定制**: 可以在 Brevo 后台配置表单样式，或通过 CSS 覆盖
- **邮件模板**: 使用项目提供的定制邮件模板，保持品牌一致性
- **成功页面**: 用户提交后会跳转到 `/subscribe/success` 页面，提示激活订阅

### 自动化邮件发送（Cron Job）
项目配置了 Vercel Cron Jobs，用于自动发送最新的 AI 新闻给邮件订阅者：

**Cron 配置** (`vercel.json`):
- **执行时间**: 每天 8:30、13:30 和 20:30（UTC 时间）
- **API 端点**: `/api/send-latest-ai-news?campaignId=6`
- **功能**: 自动从 Supabase 获取最新的中文内容，并发送给 Brevo Campaign 的订阅者

**API 路由** (`src/app/api/send-latest-ai-news/route.ts`):
- **方法**: GET 或 POST
- **参数**: `campaignId` (查询参数或请求体，默认值为 6)
- **功能**:
  1. 从 Supabase `n8n-ai-contents` 表获取最新的 `lang=zh_CN` 记录
  2. 从 Brevo Campaign 获取订阅者邮件列表
  3. 使用 Brevo Transactional Email API 批量发送个性化邮件
  4. 返回发送结果统计

**Cron 表达式**:
- `30 8 * * *` - 每天 8:30 UTC（北京时间 16:30）
- `30 13 * * *` - 每天 13:30 UTC（北京时间 21:30）
- `30 20 * * *` - 每天 20:30 UTC（北京时间次日 4:30）

**环境变量要求**:
- `BREVO_API_KEY` - Brevo API 密钥（必需）
- `BREVO_SENDER_EMAIL` - 发件人邮箱（可选，默认：yangshiqi1089@gmail.com）
- `BREVO_SENDER_NAME` - 发件人名称（可选，默认：AINews）
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL（必需）
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名密钥（必需）

**手动触发**:
可以通过访问以下 URL 手动触发邮件发送：
```
GET /api/send-latest-ai-news?campaignId=6
POST /api/send-latest-ai-news
{
  "campaignId": 6
}
```

## 🏆 项目亮点

1. **现代化架构**: Next.js 16 + React 19最新技术栈
2. **SEO友好**: 完整的服务端渲染和元数据优化
3. **用户体验**: 复古风格与现代交互的完美结合
4. **国际化**: 中英文无缝切换
5. **性能优化**: 快速加载和响应式设计
6. **可维护性**: 清晰的代码结构和完善的文档
7. **自动化部署**: 完整的CI/CD流程支持

---

**项目状态**: 生产就绪，采用服务端渲染架构