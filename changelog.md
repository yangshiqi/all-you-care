## 2025-01-XX - Vercel Cron Job 自动发送最新 AI 新闻

### 🎯 功能增强
- **自动化邮件发送**: 配置 Vercel Cron Jobs，自动在指定时间发送最新的 AI 新闻给邮件订阅者
- **定时任务**: 每天 8:30、13:30 和 20:30（UTC 时间）自动执行
- **API 路由**: 新增 `/api/send-latest-ai-news` API 路由，用于执行邮件发送任务

### ✨ 新功能
- **Cron 配置**: 在 `vercel.json` 中添加三个 cron job 配置
- **API 路由**: 创建 `src/app/api/send-latest-ai-news/route.ts` API 路由
- **功能复用**: API 路由复用了 `send-latest-ai-news.js` 脚本的所有功能
- **手动触发**: 支持通过 GET 或 POST 请求手动触发邮件发送

### 🔧 技术实现
- **Cron 表达式**: 
  - `30 8 * * *` - 每天 8:30 UTC
  - `30 13 * * *` - 每天 13:30 UTC
  - `30 20 * * *` - 每天 20:30 UTC
- **API 功能**:
  1. 从 Supabase 获取最新的 `lang=zh_CN` 内容
  2. 从 Brevo Campaign 获取订阅者列表
  3. 批量发送个性化邮件
  4. 返回详细的发送结果统计

### 📝 修改文件
- **新增文件**:
  - `src/app/api/send-latest-ai-news/route.ts` - Cron API 路由
- **更新的文件**:
  - `vercel.json` - 添加 cron jobs 配置
  - `allaboutproject.md` - 添加自动化邮件发送说明
  - `changelog.md` - 记录此次变更

### 🔄 使用方式
- **自动执行**: Vercel 会根据配置的时间自动执行 cron job
- **手动触发**: 可以通过访问 `/api/send-latest-ai-news?campaignId=6` 手动触发
- **参数配置**: 支持通过查询参数或请求体传递 `campaignId`（默认值为 6）

### 📋 环境变量要求
- `BREVO_API_KEY` - Brevo API 密钥（必需）
- `BREVO_SENDER_EMAIL` - 发件人邮箱（可选）
- `BREVO_SENDER_NAME` - 发件人名称（可选）
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL（必需）
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名密钥（必需）

### 📚 相关文档
- Vercel Cron Jobs 文档: https://vercel.com/docs/cron-jobs
- API 路由实现参考了 `scripts/send-latest-ai-news.js` 脚本的逻辑

## 2025-01-XX - 设置网站默认语言为中文

### 🎯 语言设置更新
- **默认语言**: 将网站默认语言从英文改为中文
- **服务端渲染**: 服务端渲染时默认使用中文
- **HTML lang 属性**: 更新 HTML lang 属性为 `zh-CN`
- **Open Graph**: 更新 Open Graph locale 为主语言中文

### ✨ 功能特性
- **默认中文**: 新用户访问网站时默认显示中文界面
- **语言检测**: 保留浏览器语言检测和 localStorage 语言偏好
- **回退语言**: 将 fallbackLng 从 'en' 改为 'zh-CN'
- **SEO优化**: HTML lang 属性设置为中文，提升中文SEO表现

### 📝 修改文件
- `src/lib/i18n.ts` - 更新默认语言检测逻辑，服务端和客户端默认返回 'zh-CN'
- `src/app/layout.tsx` - 更新 HTML lang 属性为 'zh-CN'，更新 Open Graph locale

### 🔧 技术改进
- **服务端默认**: 服务端渲染时返回 'zh-CN' 而不是 'en'
- **客户端默认**: 当没有 localStorage 和浏览器语言偏好时，默认返回 'zh-CN'
- **回退语言**: i18n fallbackLng 设置为 'zh-CN'
- **元数据**: Open Graph locale 主语言设置为 'zh_CN'，备用语言为 'en_US'

### 🌐 语言优先级
1. localStorage 中保存的语言偏好（最高优先级）
2. 浏览器语言设置
3. 默认中文（zh-CN）

## 2025-01-XX - 新增发送最新 AI 新闻脚本

### ✨ 新功能
- **发送最新 AI 新闻脚本**: 新增 `scripts/send-latest-ai-news.js` 脚本，用于自动发送最新的 AI 新闻给邮件订阅者
- **自动化邮件发送**: 脚本能够从 Brevo Campaign 获取订阅者列表，从 Supabase 获取最新中文内容，并批量发送邮件

### 📝 功能特性
- **订阅者获取**: 从指定的 Brevo Campaign 获取所有订阅者邮件列表
- **内容获取**: 从 Supabase `n8n-ai-contents` 表获取最新的 `lang=zh_CN` 记录
- **批量发送**: 使用 Brevo Transactional Email API 批量发送个性化邮件
- **错误处理**: 完整的错误处理和进度跟踪
- **个性化支持**: 支持邮件内容中的占位符替换（`{{FIRSTNAME}}`, `{{LASTNAME}}`, `{{EMAIL}}`）

### 📝 修改文件
- **新增文件**:
  - `scripts/send-latest-ai-news.js` - 主脚本文件
  - `ai-docs/send-latest-ai-news-script.md` - 脚本实现文档
- **更新的文件**:
  - `scripts/README.md` - 添加新脚本的使用说明
  - `changelog.md` - 记录此次变更

### 🔧 使用方法
```bash
# 使用默认 campaign ID (6)
node scripts/send-latest-ai-news.js

# 指定 campaign ID
node scripts/send-latest-ai-news.js 6
```

### 📋 环境变量要求
- `BREVO_API_KEY` - Brevo API 密钥（必需）
- `BREVO_SENDER_EMAIL` - 发件人邮箱（可选）
- `BREVO_SENDER_NAME` - 发件人名称（可选）
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL（必需）
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名密钥（必需）

### 📚 相关文档
- 详细实现说明请参考 `ai-docs/send-latest-ai-news-script.md`
- 脚本使用说明请参考 `scripts/README.md`

## 2025-01-XX - 移除静态页面生成机制

### 🗑️ 功能移除
- **删除静态生成脚本**: 移除了所有静态页面生成相关的脚本文件
- **移除静态导出配置**: 从 Next.js 配置中移除了静态导出相关配置
- **清理相关脚本命令**: 从 package.json 中删除了所有静态生成相关的 npm 脚本

### 📝 修改文件
- **删除的文件**:
  - `scripts/generate-static-pages.js` - 基础静态页面生成脚本
  - `scripts/generate-static-pages-advanced.js` - 高级静态页面生成脚本
  - `scripts/deploy-static.sh` - 静态站点部署脚本
  - `scripts/example-usage.js` - 静态生成使用示例脚本
- **更新的文件**:
  - `package.json` - 移除了所有静态生成相关的脚本命令
  - `next.config.ts` - 移除了 `output: 'export'` 和 `trailingSlash: true` 配置
  - `allaboutproject.md` - 删除了静态页面生成系统章节和相关描述
  - `changelog.md` - 记录此次变更

### 🔄 变更说明
项目现在完全采用服务端渲染(SSR)架构，不再支持静态页面生成和静态导出。所有页面将通过 Next.js 的服务端渲染功能提供，确保更好的动态内容支持和实时数据更新能力。

### 📋 移除的脚本命令
- `generate-static`
- `generate-static-advanced`
- `generate-static-incremental`
- `generate-static-force`
- `build-with-static`
- `build-with-static-advanced`
- `preview`
- `preview-advanced`
- `deploy`
- `deploy-vercel`
- `deploy-netlify`
- `preview-local`
- `example`
- `vercel-build`

### ⚠️ 注意事项
- 项目现在完全依赖 Next.js SSR 架构
- 部署时需要使用支持 Node.js 运行时的平台（如 Vercel）
- `out/` 目录将不再用于静态导出，如有需要可以删除

## 2025-01-XX - 订阅成功页面支持两种状态

### 🎯 功能增强
- **双状态支持**: 订阅成功页面现在支持两种不同的状态显示
- **状态识别**: 根据 URL 参数自动识别并显示对应的状态
- **激活成功状态**: 新增激活成功状态的完整UI和文案

### ✨ 新功能
- **状态 1 - 待激活**: 用户提交订阅后显示，提示去邮箱激活
- **状态 2 - 已激活**: 用户点击激活链接后显示，庆祝订阅成功
- **智能切换**: 根据 URL 参数 `status=activated` 或 `activated=true` 自动切换状态
- **视觉区分**: 两种状态使用不同的图标和颜色方案

### 🎨 UI/UX 改进
- **待激活状态**: 
  - 邮箱图标 + 蓝色提示框
  - 强调需要检查邮箱并点击激活链接
- **已激活状态**:
  - 对勾图标 + 绿色成功提示框
  - 庆祝订阅激活成功，欢迎加入社区

### 📝 修改文件
- `src/app/subscribe/success/page.tsx` - 添加状态判断逻辑和两种状态的UI
- `src/lib/locales/en.ts` - 添加激活成功状态的英文翻译
- `src/lib/locales/zh_CN.ts` - 添加激活成功状态的中文翻译

### 🌐 翻译更新
**英文版本 - 激活成功状态**:
- `activatedTitle`: "Subscription Activated!"
- `activatedSubtitle`: "Welcome to AINews"
- `activatedMessageTitle`: "You're all set!"
- `activatedMessage`: 说明订阅已激活，将开始接收邮件
- `activatedSuccessTitle`: "Subscription Confirmed"
- `activatedSuccessMessage`: 感谢确认订阅，将开始接收每日摘要

**中文版本 - 激活成功状态**:
- `activatedTitle`: "订阅已激活！"
- `activatedSubtitle`: "欢迎加入 AINews"
- `activatedMessageTitle`: "一切就绪！"
- `activatedMessage`: 说明订阅已激活，将开始接收邮件
- `activatedSuccessTitle`: "订阅确认成功"
- `activatedSuccessMessage`: 感谢确认订阅，将开始接收每日摘要

### 🔄 使用方式
- **提交后**: `/subscribe/success?email=user@example.com` (待激活状态)
- **激活后**: `/subscribe/success?email=user@example.com&status=activated` (已激活状态)
- **或**: `/subscribe/success?email=user@example.com&activated=true` (已激活状态)

## 2025-01-XX - 订阅成功页面邮箱激活提示优化

### 🎯 用户体验优化
- **激活提示**: 订阅成功页面增加明确的邮箱激活提示
- **视觉强调**: 添加邮箱图标和信息提示框，突出需要检查邮箱的重要性
- **流程说明**: 明确告知用户需要点击邮箱中的激活链接才能开始接收邮件

### ✨ 新功能
- **邮箱图标**: 在成功消息卡片顶部添加邮箱图标，视觉上提醒用户检查邮箱
- **激活提示框**: 添加醒目的信息提示框，说明激活步骤的重要性
- **多语言支持**: 激活提示文案支持中英文切换

### 🎨 UI/UX 改进
- **视觉层次**: 使用信息提示框突出显示激活步骤
- **图标提示**: 邮箱图标和信息图标增强视觉引导
- **文案优化**: 更新提示文案，明确说明不激活将无法接收邮件

### 📝 修改文件
- `src/app/subscribe/success/page.tsx` - 添加邮箱图标和激活提示框
- `src/lib/locales/en.ts` - 更新英文翻译，添加激活相关提示
- `src/lib/locales/zh_CN.ts` - 更新中文翻译，添加激活相关提示

### 🌐 翻译更新
**英文版本**:
- `messageTitle`: "Check your email!" - 提醒用户检查邮箱
- `activationTitle`: "Important: Activate Your Subscription" - 激活订阅的重要性
- `activationMessage`: 详细说明需要检查邮箱和点击激活链接
- `additionalInfo`: 提示检查垃圾邮件文件夹

**中文版本**:
- `messageTitle`: "请查收您的邮箱！" - 提醒用户检查邮箱
- `activationTitle`: "重要提示：激活您的订阅" - 激活订阅的重要性
- `activationMessage`: 详细说明需要检查邮箱和点击激活链接
- `additionalInfo`: 提示检查垃圾邮件文件夹

### 🔄 用户流程
1. 用户提交订阅表单
2. 跳转到成功页面
3. 看到邮箱图标和明确的激活提示
4. 收到确认邮件并点击激活链接
5. 开始接收订阅邮件

## 2025-01-XX - Brevo 邮件确认模板定制

### 🎨 视觉更新
- **邮件模板定制**: 创建符合网站风格的 Brevo 双重确认邮件模板
- **品牌一致性**: 邮件模板使用与网站相同的复古报纸风格和配色方案
- **双语支持**: 提供英文和中文两个版本的确认邮件模板

### ✨ 设计特性
- **品牌标识**: 邮件顶部显示 AINews logo 和 "by allyoucare.ai" 副标题
- **复古风格**: 使用黑色 (#171717) 作为主色调，匹配网站风格
- **字体系统**: 使用 Inter 字体作为主字体，Courier Prime 用于次要文本
- **按钮样式**: 确认按钮使用黑色背景 (#171717) 和白色文字 (#fafafa)，带有 2px 边框
- **响应式设计**: 邮件模板适配移动端和桌面端显示

### 📧 邮件内容
**英文版本** (`email-templates/double-optin-confirmation.html`):
- 标题: "Please confirm your subscription"
- 描述: "Thank you for subscribing to AINews! We're excited to help you stay ahead of the latest AI developments."
- 按钮: "Yes, subscribe me to this list"
- 隐私声明: "We respect and protect your privacy."

**中文版本** (`email-templates/double-optin-confirmation-zh.html`):
- 标题: "请确认您的订阅"
- 描述: "感谢您订阅 AINews！我们很高兴能够帮助您及时了解最新的 AI 发展动态。"
- 按钮: "是的，订阅此列表"
- 隐私声明: "我们尊重并保护您的隐私，不会将您的 email 泄露给任何第三方。"

### 🎨 样式特点
- **配色方案**: 
  - 主色: #171717 (近黑色)
  - 背景: #f5f5f5 (浅灰色)
  - 文字: #525252 (深灰色) / #737373 (中灰色)
  - 边框: #e5e5e5 (浅边框)
- **字体大小**: 
  - Logo: 32px
  - 标题: 24px
  - 正文: 14px / 13px
  - 次要文本: 12px / 11px / 10px
- **间距**: 统一使用 20px/30px/40px 的垂直间距

### 📝 文件结构
- `email-templates/double-optin-confirmation.html` - 英文版确认邮件模板
- `email-templates/double-optin-confirmation-zh.html` - 中文版确认邮件模板

### 🔧 使用说明
1. 登录 Brevo 账户
2. 导航至 "Email" → "Templates" 或 "Campaigns" → "Double opt-in"
3. 创建或编辑双重确认邮件模板
4. 将 HTML 代码复制到 Brevo 编辑器
5. 确保 `{{ doubleoptin }}` 变量正确设置（Brevo 会自动替换）
6. 根据用户语言设置自动选择对应的模板

### 📚 文档更新
- 在 `allaboutproject.md` 中添加邮件模板说明
- 更新 `changelog.md` 记录此次更新

## 2025-01-XX - 首页表单替换为 Brevo 原生表单

### 🎉 重大更新
- **表单替换**: 将首页邮件订阅表单替换为 Brevo 原生表单
- **直接提交**: 表单现在直接提交到 Brevo 服务器，无需通过后端 API
- **样式保留**: 保留网站原有的复古风格样式和 Tailwind CSS 类

### ✨ 新功能
- **Brevo 原生表单**: 使用 Brevo 提供的表单 action 直接提交
- **多语言支持**: 根据当前语言自动设置 `locale` 字段（en/zh）
- **防机器人**: 使用 Brevo 的 `email_address_check` 隐藏字段防止机器人提交

### 🔧 技术改进
- **表单结构**: 使用 Brevo 表单的字段名和结构
  - `EMAIL` - 邮箱输入字段
  - `email_address_check` - 防机器人隐藏字段
  - `locale` - 语言设置（根据 i18n 自动设置）
  - `html_type` - HTML 类型（固定为 simple）
- **提交方式**: 表单直接 POST 到 Brevo 服务器
- **样式集成**: 保留网站的 `vintage-border`、`bg-card` 等样式类
- **响应式设计**: 保持原有的响应式布局和交互效果

### 📝 修改文件
- `src/components/Hero.tsx` - 替换表单为 Brevo 原生表单，保留网站样式
- `changelog.md` - 记录此次表单替换

### 🔄 变更说明
- **移除**: 移除了 `/api/subscribe` API 调用
- **保留**: 保留了表单的加载状态和网站样式
- **兼容**: Brevo 表单会自动处理重定向和成功页面

## 2025-01-XX - 迁移邮件订阅服务从 HubSpot 到 Brevo

### 🎉 重大更新
- **服务迁移**: 将邮件订阅服务从 HubSpot 迁移到 Brevo（前称 Sendinblue）
- **API 更新**: 更新订阅 API 路由以使用 Brevo Contacts API v3
- **功能保持**: 保持所有现有功能，包括创建/更新联系人、错误处理等

### ✨ 新功能
- **Brevo 集成**: 使用 Brevo API 进行联系人管理
- **列表管理**: 支持将联系人添加到指定的 Brevo 邮件列表（可选）
- **自动更新**: 通过 `updateEnabled: true` 自动处理联系人已存在的情况

### 🔧 技术改进
- **API 端点**: 从 HubSpot API 切换到 Brevo API (`https://api.brevo.com/v3/contacts`)
- **认证方式**: 从 Bearer Token 切换到 API Key 认证
- **字段映射**: 
  - `firstName` → `FIRSTNAME` (Brevo 属性)
  - `lastName` → `LASTNAME` (Brevo 属性)
  - `SUBSCRIPTION_SOURCE` → `ainews` (标识订阅来源)
- **错误处理**: 优化错误处理逻辑，处理 Brevo API 返回的错误响应

### 📝 修改文件
- `src/app/api/subscribe/route.ts` - 完全重写订阅逻辑，从 HubSpot 切换到 Brevo
- `allaboutproject.md` - 更新文档，将 HubSpot 集成说明替换为 Brevo
- `changelog.md` - 记录此次迁移

### ⚙️ 环境配置变更
**旧配置**:
```bash
HUBSPOT_ACCESS_TOKEN=your-hubspot-access-token
```

**新配置**:
```bash
BREVO_API_KEY=your-brevo-api-key
BREVO_LIST_ID=your-list-id  # 可选
```

### 📚 文档更新
- 更新 `allaboutproject.md` 中的邮件订阅集成章节
- 添加 Brevo API 密钥获取说明
- 添加 Brevo 列表 ID 获取说明
- 更新 API 文档链接

### 🔄 迁移说明
- **向后兼容**: API 端点 `/api/subscribe` 保持不变
- **请求格式**: 请求体格式保持不变
- **响应格式**: 响应格式基本保持一致
- **环境变量**: 需要更新环境变量配置

## 2025-01-XX - 添加 subscription_type 字段到 HubSpot 订阅

### ✨ 新功能
- **用户分类标识**: 在 HubSpot 联系人中添加 `subscription_type` 字段，固定值为 `ainews`
- **便于筛选**: 可以在 HubSpot 中轻松筛选和识别从 AINews 表单提交的用户

### 🔧 技术改进
- **创建联系人**: 创建新联系人时自动设置 `subscription_type` 为 `ainews`
- **更新联系人**: 更新现有联系人时也会更新 `subscription_type` 字段
- **字段同步**: 在搜索联系人时也包含 `subscription_type` 字段

### 📝 修改文件
- `src/app/api/subscribe/route.ts` - 在创建和更新联系人时添加 `subscription_type` 字段
- `allaboutproject.md` - 更新文档说明字段映射
- `changelog.md` - 更新变更记录

## 2025-01-XX - HubSpot 邮件订阅集成

### 🎉 重大更新
- **HubSpot 集成**: 完成与 HubSpot CRM 的邮件订阅功能集成
- **自动化订阅**: 用户提交表单后自动添加到 HubSpot 联系人列表
- **联系人管理**: 支持创建新联系人和更新现有联系人信息

### ✨ 新功能
- **API 路由**: 新增 `/api/subscribe` API 端点处理订阅请求
- **表单提交**: Hero 组件表单现在会将数据提交到 HubSpot
- **加载状态**: 提交过程中显示加载状态，防止重复提交
- **错误处理**: 完善的错误处理和用户友好的错误提示
- **多语言支持**: 成功/错误消息支持中英文切换

### 🔧 技术改进
- **HubSpot Contacts API**: 使用 HubSpot CRM v3 API 进行联系人管理
- **错误处理**: 自动处理联系人已存在的情况（409错误），更新联系人信息
- **数据验证**: 服务端验证邮箱格式和必填字段
- **类型安全**: 完整的 TypeScript 类型定义

### 📧 HubSpot 功能
- **创建联系人**: 自动创建新的 HubSpot 联系人
- **更新联系人**: 如果联系人已存在，自动更新联系人信息
- **字段映射**: 
  - `email` → HubSpot `email` 字段
  - `firstName` → HubSpot `firstname` 字段
  - `lastName` → HubSpot `lastname` 字段
  - `subscription_type` → HubSpot `subscription_type` 字段（固定值：`ainews`）

### 📝 修改文件
- `src/app/api/subscribe/route.ts` - 新增 HubSpot 订阅 API 路由
- `src/components/Hero.tsx` - 更新表单提交逻辑，集成 API 调用
- `src/lib/locales/en.ts` - 添加订阅相关的英文翻译
- `src/lib/locales/zh_CN.ts` - 添加订阅相关的中文翻译
- `allaboutproject.md` - 更新项目文档，添加 HubSpot 集成说明

### ⚙️ 环境配置
需要在环境变量中配置 HubSpot Access Token:
```bash
HUBSPOT_ACCESS_TOKEN=your-hubspot-access-token
```

### 📚 文档更新
- 在 `allaboutproject.md` 中添加了完整的 HubSpot 集成文档
- 包含 API 使用说明、环境配置和获取 Access Token 的步骤

## 2025-01-XX - Issues 列表页分页功能

### 🎉 重大更新
- **分页功能**: 为 issues 列表页添加完整的分页功能，默认每页显示 10 条记录
- **SEO 友好**: 使用服务端渲染(SSR)和 URL 参数实现 SEO 友好的分页
- **URL 变化**: 翻页时 URL 会变化（例如 `/issues?page=2`），便于搜索引擎索引和用户分享

### ✨ 新功能
- **服务端分页**: 在服务端获取分页数据，提升首屏加载速度和 SEO 表现
- **分页组件**: 集成现有的 Pagination 组件，提供完整的分页导航
- **动态元数据**: 根据当前页码动态生成页面标题和元数据
- **多语言支持**: 分页相关的文本支持中英文切换

### 🔧 技术改进
- **API 层**: 新增 `getAllAiContentsPaginated()` 函数，支持分页查询
- **服务端组件**: 将 `issues/page.tsx` 改为服务端组件，接收 `searchParams` 处理分页
- **数据传递**: `IssuesList` 组件改为接收初始数据作为 props，保持客户端交互能力
- **类型安全**: 新增 `PaginatedResult<T>` 接口，提供完整的类型定义

### 📊 分页特性
- **默认显示**: 每页默认显示 10 条记录
- **URL 参数**: 使用 `?page=N` 格式的 URL 参数
- **总数统计**: 显示总记录数和当前页范围
- **页码导航**: 智能显示页码（最多显示 5 个页码，超出显示省略号）
- **上一页/下一页**: 提供便捷的导航按钮

### 🎨 用户体验
- **快速加载**: 服务端渲染确保内容立即可见
- **URL 可分享**: 每个分页都有独立的 URL，便于分享和收藏
- **SEO 优化**: 搜索引擎可以抓取所有分页内容
- **响应式设计**: 分页组件完美适配移动端和桌面端

### 📝 修改文件
- `src/lib/api.ts` - 新增分页查询函数和类型定义
- `src/app/issues/page.tsx` - 改为服务端组件，处理分页参数
- `src/components/IssuesList.tsx` - 接收分页数据作为 props，集成 Pagination 组件
- `src/lib/locales/en.ts` - 添加分页相关英文翻译
- `src/lib/locales/zh_CN.ts` - 添加分页相关中文翻译

## 2025-01-XX
- feat(content): 在获取 issues 详情页信息时，从 Supabase 中获取的 content 数据只提取 `<body>` 标签内的内容（不包括 body 标签本身）。
- refactor(html): 新增 `extractBodyContent` 函数用于从 HTML 中提取 body 标签内的内容。
- fix(parsing): 优化 `formatHtmlContent` 函数，确保只处理 body 标签内的 HTML 内容，提升内容解析的准确性。
- feat(filter): 新增 `removeTagsSection` 函数，从 content 中过滤掉 tags 相关的 section。
  - 自动移除包含 `class="tags"` 的容器元素（div, section, aside 等）
  - 自动移除包含 `id="tags"` 或 `id="tag"` 的元素
  - 自动移除包含 `class="tag"` 的单个标签元素
  - 自动移除包含"相关标签"或"Related Tags"文本的 section 元素（如 `<section><h2>相关标签</h2></section>` 或 `<section><h2>Related Tags</h2></section>`）
  - 支持循环处理嵌套的 tags 结构，确保完全移除所有相关元素
- feat(style): 大幅增强 issues 详情页的内容展示样式，提升可读性和视觉层次。
  - **标题样式**: h2 添加左侧边框强调，h3 添加背景色块突出显示，h4 优化颜色和字重
  - **文章卡片**: article 标签添加背景色、左侧边框和悬停效果，增强内容区块的视觉识别
  - **标签系统**: 为 `.tags` 和 `.tag` 添加完整样式，包括悬停交互效果
  - **摘要样式**: `.summary` 类添加背景和边框，突出显示重要摘要内容
  - **列表增强**: 优化 ul/ol 样式，标记颜色与主题色统一
  - **链接优化**: 添加下划线和悬停背景高亮效果，提升交互体验
  - **引用样式**: blockquote 添加左侧边框和背景，增强引用内容的识别度
  - **代码样式**: code 和 pre 标签添加背景、边框和圆角，提升代码展示效果
  - **保持风格**: 所有样式均使用现有配色方案（primary, secondary, border 等 CSS 变量），完美契合复古报纸风格

## 2025-10-30
- feat(tags): 新增按标签访问功能 `/tags/[tag]`，支持根据标签筛选包含该标签的内容。
- feat(tags): 新增所有标签列表页面 `/tags`，展示所有可用标签及其文章数量统计。
- feat(seo): 为标签页面生成动态 `title/description` 元数据以提升SEO。
- feat(static): 实现 `generateStaticParams` 函数，支持 Next.js 静态导出（`output: 'export'`）。
- feat(nav): 在 Header 导航中启用标签链接。
- feat(i18n): 为标签页面添加中英文翻译支持。
- fix(links): 为所有标签链接添加 URL 编码（`encodeURIComponent`），确保特殊字符正确处理。
- fix(calendar): 修复 Calendar 组件以适配新版本的 `react-day-picker` API。
- deps: 安装缺失依赖（`embla-carousel-react`、`react-day-picker`、`recharts`）。
- docs: 新增 `ai-docs/tags-page-implementation-2025-10-30.md` 记录实现方案与技术细节。

## 2025-10-29
- feat(i18n/supabase): 为 Supabase `n8n-ai-contents` 接口增加语言过滤能力（`lang: en|zh_CN`），并在 `RecentIssues` 和 `IssuesList` 依据 `i18n.language` 传入过滤参数。
- refactor(types): `N8nAiContent` 增加可选字段 `lang`。
- feat(i18n): 为 `IssuesList` 组件添加完整的国际化支持，包括所有文本的翻译。
- docs: 新增 `ai-docs/supabase-lang-filter-2025-10-29.md` 记录实现细节与后续建议。
# 更新日志

## [2025-01-XX] - 移除特定标题标签

### 🎯 内容清理
- **移除特定标题**: 从HTML内容中自动移除 `<h1>AI新闻简报</h1>` 和 `<h2>AI新闻分类汇总</h2>` 及其英文变体
- **英文变体支持**: 同时移除 "AI News Brief"、"AI News Roundup"、"AI News Summary"、"AI News Categories" 等英文标题

### ✨ 功能增强
- **自动过滤**: 在 `removeTagsSection` 函数中添加标题移除逻辑
- **多语言支持**: 支持中文和英文标题的自动识别和移除
- **循环处理**: 在循环处理中优先移除这些标题，确保完全清理

### 📝 修改文件
- `src/app/issues/[slug]/page.tsx` - 在 `removeTagsSection` 函数中添加标题移除逻辑

### 🔧 技术实现
- 使用正则表达式匹配 `<h1>` 和 `<h2>` 标签中的特定文本
- 支持标签中的属性（如 `class`、`id` 等）
- 忽略空白字符，确保匹配的准确性

## [2025-01-XX] - 首页介绍文案更新：面向所有人，打破信息茧房

### 🎯 定位调整
- **目标受众扩展**: 从"AI工程师"扩展到"所有人"
- **核心使命**: 以打破每个人的信息茧房为目标
- **价值主张**: 强调压缩信息、节省时间、缓解焦虑

### ✨ 文案更新
**中文版本**:
- **副标题**: "每一个顶尖 AI 工程师都应该有的资讯获取方式" → "打破信息茧房，为每个人提供优质的行业资讯"
- **描述**: 新增"我们以打破每个人的信息茧房为目标，收集行业内的新闻，帮助大家压缩信息、节省时间、缓解焦虑"

**英文版本**:
- **副标题**: "Every top AI Engineer should have a way to keep up with the latest news." → "Break your information bubble with quality industry news for everyone."
- **描述**: 新增"We break information bubbles by collecting industry news to help everyone compress information, save time, and reduce anxiety."

### 📝 修改文件
- `src/app/page.tsx` - 更新页面元数据（title、description、Open Graph、Twitter Card）
- `src/lib/locales/zh_CN.ts` - 更新中文翻译（hero.subtitle、hero.description、siteTitle、siteDescription）
- `src/lib/locales/en.ts` - 更新英文翻译（hero.subtitle、hero.description、siteTitle、siteDescription）

### 🎨 内容特点
- **打破信息茧房**: 突出平台的使命是帮助用户突破信息局限
- **面向所有人**: 不再局限于AI工程师，欢迎所有对行业资讯感兴趣的用户
- **价值主张**: 明确强调压缩信息、节省时间、缓解焦虑三大核心价值
- **行业资讯**: 强调收集行业内的新闻，提供全面的信息覆盖

## [2025-10-29] - 推荐语内容更新

### 🎯 内容优化
- **推荐语更新**: 更换首页的四个用户推荐语，突出AI信息管理的核心价值
- **主题聚焦**: 强调在AI快速发展中进行知识压缩和信息筛选的重要性
- **用户痛点**: 突出解决信息过载与及时更新之间的平衡问题
- **双语更新**: 同步更新中英文版本的推荐内容

### ✨ 新推荐语
**中文版本**:
1. **Alex Chen**: "在AI领域，每天都有新突破。这个平台帮我快速筛选真正重要的信息"
2. **Sarah Kim**: "信息过载是AI工程师最大的挑战，这里的内容压缩让我保持领先"
3. **David Liu**: "不需要翻遍所有论坛，这里已经为我做了最好的总结"
4. **Emma Wang**: "在快速变化的AI世界，这是我保持更新的秘密武器"

**英文版本**:
1. **Alex Chen**: "In AI, breakthroughs happen daily. This platform helps me filter what truly matters"
2. **Sarah Kim**: "Information overload is the biggest challenge for AI engineers, This digest keeps me ahead of the curve"
3. **David Liu**: "No need to scroll through endless forums, the best summaries are already here"
4. **Emma Wang**: "In the fast-moving AI world, this is my secret weapon to stay updated"

### 🎨 内容特点
- **信息筛选**: 强调快速筛选重要信息的能力
- **内容压缩**: 突出知识概览和压缩的价值
- **时间节省**: 不需要翻遍各个论坛和平台
- **保持领先**: 在快速变化中保持更新和竞争力

### 📝 修改文件
- `src/lib/locales/zh_CN.ts` - 更新中文推荐语
- `src/lib/locales/en.ts` - 更新英文推荐语

## [2025-10-29] - Header Logo 更新

### 🎨 视觉更新
- **新Logo设计**: 将Header中的品牌标识更新为火焰图标 + "All you care" 文字组合
- **SVG图标**: 使用自定义SVG火焰图标替代原有的文字logo
- **色调统一**: Logo颜色使用 `currentColor`，自动匹配网站的黑白色调主题
- **交互效果**: 添加hover悬停效果，logo图标微缩放，整体透明度变化

### ✨ 设计特性
- **图标尺寸**: 40x40px 的火焰图标
- **文字样式**: 粗体、2xl大小、大写字母、宽字距
- **组合布局**: 使用flex布局，图标与文字间隔3个单位
- **响应式**: 图标在悬停时轻微放大(scale-105)
- **品牌更新**: 从"AINews"更新为"All you care"

### 🔧 技术实现
- **SVG内联**: 直接在组件中内联SVG代码，无需额外资源加载
- **主题适配**: 使用 `text-primary` 和 `currentColor`，完美适配主题色
- **动画过渡**: 使用 Tailwind 的 transition 类实现流畅动画
- **分组效果**: 使用 `group` 和 `group-hover` 实现组合hover效果

## [2024-10-29] - Next.js静态导出修复

### 🐛 问题修复
- **generateStaticParams**: 为动态路由页面添加必需的 `generateStaticParams()` 函数
- **类型转换**: 修复参数类型错误，确保slug为字符串类型
- **静态导出兼容**: 修复 `output: 'export'` 配置下的构建错误
- **动态路由**: 确保所有issue详情页能够正确生成静态页面

### 🔧 技术改进
- 在 `src/app/issues/[slug]/page.tsx` 中添加 `generateStaticParams()` 函数
- 使用 `String()` 将数据库ID转换为字符串类型
- 从Supabase获取所有AI内容ID作为静态参数
- 添加错误处理，避免构建失败

### 📝 相关修改
- 导入 `getAllAiContents` 函数
- 生成所有issue的slug参数列表（字符串类型）
- 确保Next.js知道需要生成哪些静态页面
- 修复类型不匹配问题（number → string）

## [2024-12-19] - 静态页面生成系统

### 🎉 重大更新
- **静态生成**: 完整的静态页面生成系统，支持从Supabase数据生成静态HTML页面
- **SEO优化**: 每个静态页面包含完整的meta标签、Open Graph和Twitter Card
- **自动化部署**: 支持Vercel、Netlify等平台的自动化部署
- **增量更新**: 支持只更新有变化的页面，大幅提高生成效率

### ✨ 新功能
- **基础生成脚本**: `scripts/generate-static-pages.js` - 简单易用的静态页面生成
- **高级生成脚本**: `scripts/generate-static-pages-advanced.js` - 支持增量更新、批量处理、错误重试
- **部署脚本**: `scripts/deploy-static.sh` - 完整的构建和部署自动化流程
- **sitemap生成**: 自动生成包含所有页面的sitemap.xml
- **响应式设计**: 生成的静态页面完美适配移动端和桌面端

### 🔧 技术改进
- **Next.js配置**: 更新配置支持静态导出 (`output: 'export'`)
- **批量处理**: 支持大量数据的批量处理，避免内存溢出
- **错误重试**: 自动重试失败的页面生成，提高成功率
- **进度显示**: 实时显示生成进度和统计信息
- **日志系统**: 可配置的日志级别，便于调试和监控

### 📦 脚本命令
```bash
# 基础静态生成
npm run generate-static

# 高级静态生成（推荐）
npm run generate-static-advanced

# 增量更新（只更新有变化的页面）
npm run generate-static-incremental

# 强制更新所有页面
npm run generate-static-force

# 构建并生成静态页面
npm run build-with-static-advanced

# 本地预览
npm run preview-local

# 部署到Vercel
npm run deploy-vercel

# 部署到Netlify
npm run deploy-netlify
```

### 📊 输出结构
```
out/
├── issues/           # 所有issue的静态HTML页面
│   ├── issue-1.html
│   ├── issue-2.html
│   └── ...
├── sitemap.xml       # 包含所有页面的sitemap
├── deployment-report.txt  # 部署报告
└── ...              # Next.js导出的其他文件
```

### 🎨 页面特性
- **完整SEO**: 每个页面包含title、description、Open Graph、Twitter Card
- **响应式设计**: 移动端和桌面端完美适配
- **复古风格**: 保持项目的复古报纸风格
- **快速加载**: 静态HTML确保极快的加载速度
- **搜索引擎友好**: 完整的结构化数据和元数据

### 📝 文档更新
- **脚本说明**: 详细的脚本使用说明和配置指南
- **部署指南**: 完整的部署流程和故障排除
- **项目文档**: 更新allaboutproject.md记录新功能

## [2024-12-19] - Issue详情页Summary展示优化

### ✨ 功能增强
- **Summary展示**: 在issue详情页的tags区域下方添加summary展示
- **布局优化**: 将summary从独立区域移动到tags区域内，形成更紧凑的布局
- **视觉分离**: 使用边框分隔线区分tags和summary区域
- **多语言支持**: 为summary区域添加中英文翻译支持

### 🎨 UI/UX改进
- **区域整合**: summary现在作为tags区域的一部分显示
- **条件渲染**: 只有当summary存在时才显示summary区域
- **样式统一**: 使用与tags相同的视觉风格和间距
- **响应式设计**: 保持在不同屏幕尺寸下的良好显示效果

### 🌐 国际化更新
- **中文翻译**: 添加"摘要"翻译
- **英文翻译**: 添加"Summary"翻译
- **翻译键**: 使用`issueDetail.summary`作为翻译键

## [2024-12-19] - 标签数据源修正

### 🎯 重要修正
- **数据源修正**: 修正标签提取逻辑，直接从 Supabase `tags` 字段获取标签数据
- **移除错误逻辑**: 不再从 `summary` 字段提取标签，直接使用 `tags` 字段
- **数据完整性**: 确保标签数据来源的准确性和一致性
- **全站统一**: 修正列表页和详情页的标签展示逻辑

### ✨ 功能优化
- **直接使用**: 直接使用 Supabase 中存储的 `tags` 字段数据
- **格式支持**: 支持数组格式和JSON字符串格式的标签数据
- **类型处理**: 智能处理数组和字符串两种数据格式
- **错误处理**: 完善的错误处理和降级机制
- **统一函数**: 所有页面使用统一的 `extractTagsFromContent` 函数

### 🔧 技术改进
- **数据源**: 从 `item.tags` 字段直接获取标签数据
- **格式检测**: 自动检测数据类型（数组 vs 字符串）
- **JSON解析**: 对字符串格式的标签进行JSON解析
- **数据验证**: 过滤空值和无效标签
- **默认值**: 解析失败时使用默认标签
- **类型定义**: 在 `N8nAiContent` 接口中添加 `tags` 字段
- **函数导出**: 将 `extractTagsFromContent` 函数导出供其他组件使用

### 📊 数据处理流程
- **Supabase查询**: 包含 `tags` 字段的数据查询
- **类型检查**: 检查 `tags` 是数组还是字符串
- **格式解析**: 字符串格式使用JSON.parse()解析
- **数据清理**: 过滤和验证标签数据
- **结果返回**: 返回最多10个有效标签

### 🎨 页面修正
- **列表页**: IssuesList 组件使用新的标签提取逻辑
- **详情页**: IssueDetailPage 的 generateTagCategories 函数使用 tags 字段
- **首页**: RecentIssues 组件已使用正确的标签逻辑

## [2024-12-19] - 首页时间范围调整

### 🎯 功能调整
- **时间范围**: 将首页"AI行业最近30天"调整为"AI行业最近7天"
- **数据筛选**: API逻辑更新，只显示最近7天内的内容
- **排序优化**: 确保按时间倒序排列显示

### ✨ 具体修改
- **中文标题**: "AI行业最近30天" → "AI行业最近7天"
- **英文标题**: "Last 30 days in AI" → "Last 7 days in AI"
- **API逻辑**: 添加7天时间范围筛选条件
- **数据获取**: 使用 `gte('created_at', sevenDaysAgoISO)` 筛选最近7天数据

### 🔧 技术改进
- **时间计算**: 动态计算7天前的日期范围
- **查询优化**: 在数据库层面进行时间筛选，提升性能
- **排序保持**: 维持按创建时间倒序排列

## [2024-12-19] - Issues 列表页 Supabase 集成

### 🎉 重大更新
- **列表页数据源**: Issues 列表页完全使用 Supabase 数据
- **客户端数据获取**: 使用 React hooks 进行客户端数据管理
- **实时搜索**: 支持按标题、摘要和标签进行实时搜索过滤

### ✨ 新功能
- **动态数据加载**: 从 Supabase 获取所有期刊数据
- **智能标签提取**: 从摘要内容自动提取相关标签
- **加载状态**: 优雅的加载动画和错误提示
- **备用数据**: 连接失败时自动使用备用数据

### 🔧 技术改进
- **客户端数据获取**: 使用 useEffect 和 useState 管理数据状态
- **错误处理**: 完善的错误处理和用户友好的提示
- **性能优化**: 客户端缓存和状态管理
- **类型安全**: 完整的 TypeScript 类型定义

### 📊 数据流程
- **列表页**: Supabase → 客户端 → 动态渲染
- **搜索过滤**: 客户端实时过滤和搜索
- **标签生成**: 自动从内容中提取标签

### 🎨 用户体验
- **响应式搜索**: 实时搜索和过滤功能
- **加载反馈**: 清晰的加载状态和错误提示
- **一致设计**: 保持原有的复古报纸风格

## [2024-12-19] - 期刊详情页 Supabase 集成

### 🎉 重大更新
- **详情页数据源**: 期刊详情页完全使用 Supabase 数据
- **HTML 内容格式化**: 自动解析和格式化 content 字段的 HTML 内容
- **服务端渲染**: 详情页在服务端获取数据，提升 SEO 和性能

### ✨ 新功能
- **内容解析**: 智能解析 content 字段，支持 HTML 和纯文本格式
- **自动标签生成**: 从摘要内容自动提取相关标签
- **动态介绍**: 根据日期自动生成期刊介绍文本
- **占位符保留**: 保留现有字段结构作为占位符

### 🔧 技术改进
- **服务端数据获取**: 详情页在服务端直接获取 Supabase 数据
- **HTML 安全渲染**: 使用 dangerouslySetInnerHTML 安全渲染 HTML 内容
- **错误处理**: 完善的错误处理和降级机制
- **类型安全**: 完整的 TypeScript 类型定义

### 📊 数据流程
- **详情页**: Supabase → 服务端 → 页面渲染
- **首页**: Supabase → 客户端 → 动态加载
- **内容格式**: 自动检测 HTML/文本格式并相应处理

### 🎨 用户体验
- **快速加载**: 服务端渲染确保内容立即可见
- **SEO 友好**: 完整的元数据和结构化内容
- **响应式设计**: 保持原有的复古报纸风格

## [2024-12-19] - Supabase 数据集成

### 🎉 重大更新
- **数据库集成**: 集成 Supabase 作为数据源
- **实时数据**: 首页期刊数据从 Supabase 实时获取
- **错误处理**: 优雅的降级机制和错误提示

### ✨ 新功能
- **Supabase 客户端**: 配置 Supabase 客户端和类型定义
- **API 服务层**: 创建统一的数据获取接口
- **数据映射**: 将 Supabase 数据映射为前端显示格式
- **加载状态**: 添加加载动画和错误状态处理
- **备用数据**: 连接失败时自动使用备用数据

### 🔧 技术改进
- **类型安全**: 完整的 TypeScript 类型定义
- **错误边界**: 完善的错误处理和用户提示
- **性能优化**: 客户端数据缓存和状态管理
- **国际化**: 新增加载和错误状态的翻译

### 📊 数据管理
- **表结构**: 支持 `n8n-ai-contents` 表 (id/title/content/summary/created_at)
- **数据获取**: `getIssueSummaries()` 和 `getAiContentById()` API
- **标签提取**: 自动从内容中提取相关标签
- **日期格式化**: 统一的日期显示格式

### 📝 文档更新
- **配置说明**: 添加 `SUPABASE_SETUP.md` 配置指南
- **环境变量**: 详细的 Supabase 环境变量配置
- **故障排除**: 常见问题和解决方案

## [2024-12-19] - 项目重构完成

### 🎉 重大更新
- **项目重构**: 从Vite + React迁移到Next.js 16 SSR架构
- **SEO优化**: 实现完整的服务端渲染，搜索引擎友好
- **性能提升**: 采用Next.js 16 + React 19最新技术栈

### ✨ 新功能
- **服务端渲染(SSR)**: 所有页面支持服务端预渲染
- **动态路由**: 期刊详情页支持动态slug参数
- **SEO元数据**: 自动生成title、description、Open Graph等
- **多语言支持**: 中英文界面无缝切换
- **响应式设计**: 完美适配移动端和桌面端

### 🔧 技术改进
- **框架升级**: Vite → Next.js 16 (App Router)
- **React版本**: React 18 → React 19
- **路由系统**: React Router → Next.js App Router
- **样式系统**: 优化Tailwind CSS配置
- **国际化**: 适配Next.js的i18n配置

### 🐛 问题修复
- **期刊详情页**: 修复动态路由参数处理问题
- **SSR渲染**: 解决HTML源代码为空的问题
- **组件兼容**: 修复客户端/服务端组件混用问题
- **样式问题**: 解决Tailwind CSS @apply指令问题

### 📁 项目结构
- **清理项目**: 删除原始Vite项目文件
- **统一结构**: 将SSR项目提升为正式项目
- **文档更新**: 完善README和项目文档

### 🚀 部署优化
- **构建优化**: 配置Next.js生产构建
- **性能优化**: 启用压缩和静态优化
- **SEO配置**: 完整的搜索引擎优化设置

---

## [2024-12-19] - 初始版本

### 🎯 项目启动
- **项目创建**: 基于Vite + React + TypeScript创建
- **UI框架**: 集成shadcn/ui组件库
- **样式系统**: 配置Tailwind CSS
- **国际化**: 实现中英文切换功能

### 📋 核心功能
- **首页**: 英雄区域和最近期刊展示
- **期刊列表**: 可筛选的期刊列表页面
- **期刊详情**: 详细的期刊内容展示
- **响应式**: 移动端和桌面端适配

### 🎨 设计特色
- **复古风格**: 报纸风格的视觉设计
- **现代交互**: 流畅的用户体验
- **多语言**: 中英文界面支持