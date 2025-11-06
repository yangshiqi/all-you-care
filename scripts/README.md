# 脚本说明

本目录包含多个实用脚本，用于项目的各种自动化任务。

## 脚本列表

### 1. send-latest-ai-news.js - 发送最新 AI 新闻给邮件订阅者

**功能**：
- 按照给定的 campaignid，从 Brevo Campaign 中获取当前的订阅者邮件
- 从 Supabase 的 `n8n-ai-contents` 表中，获取最后一个 `lang=zh_CN` 的记录
- 给这些邮件发送这条记录，邮件标题为记录的 `title`，邮件内容为记录的 `content`

**使用方法**：
```bash
# 使用默认 campaign ID (6)
node scripts/send-latest-ai-news.js

# 指定 campaign ID
node scripts/send-latest-ai-news.js 6
```

**环境变量要求**：
- `BREVO_API_KEY` - Brevo API 密钥（必需）
- `BREVO_SENDER_EMAIL` - 发件人邮箱（可选，默认：yangshiqi1089@gmail.com）
- `BREVO_SENDER_NAME` - 发件人名称（可选，默认：AINews）
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL（必需）
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名密钥（必需）

**输出示例**：
```
📧 开始发送最新的 AI 新闻给邮件订阅者...
📋 Campaign ID: 6
📰 正在从 Supabase 获取最新的中文内容...
✅ 获取到最新内容:
   标题: AI 新闻标题
   创建时间: 2025-01-XX
   内容长度: 1234 字符
📬 正在获取 Campaign 6 的订阅者邮件列表...
✅ 找到 100 个订阅者
📤 开始发送邮件...
✅ Email sent successfully to user@example.com
📊 发送结果汇总:
   总收件人数: 100
   ✅ 成功发送: 98
   ❌ 发送失败: 2
```

---

### 2. 静态页面生成脚本

这个脚本用于为每个issue详情页生成静态HTML页面并更新sitemap.xml。

## 功能特性

- 🚀 从Supabase获取所有AI内容数据
- 📄 为每个issue生成独立的静态HTML页面
- 🗺️ 自动生成包含所有页面的sitemap.xml
- 🎨 生成美观的HTML页面，包含完整的SEO元数据
- 📱 响应式设计，适配各种设备

## 使用方法

### 1. 环境配置

确保设置了以下环境变量：

```bash
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# 网站配置（可选）
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 2. 运行脚本

```bash
# 仅生成静态页面
npm run generate-static

# 构建Next.js应用并生成静态页面
npm run build-with-static

# 构建并预览静态站点
npm run preview
```

### 3. 输出文件

脚本会在 `out/` 目录下生成以下文件：

```text
out/
├── issues/           # 所有issue的静态HTML页面
│   ├── issue-1.html
│   ├── issue-2.html
│   └── ...
├── sitemap.xml       # 包含所有页面的sitemap
└── ...              # Next.js导出的其他文件
```

## 脚本功能详解

### 生成静态页面

- 从Supabase的 `n8n-ai-contents` 表获取所有数据
- 为每个issue生成独立的HTML文件
- 包含完整的SEO元数据（title、description、Open Graph、Twitter Card）
- 响应式设计，适配移动端和桌面端

### 生成sitemap.xml

- 自动包含首页和issues列表页
- 包含所有生成的issue详情页
- 设置合适的优先级和更新频率
- 符合搜索引擎标准

## 自定义配置

### 修改页面样式

编辑 `scripts/generate-static-pages.js` 中的 `generateIssueHTML` 函数来修改页面样式。

### 修改sitemap配置

编辑 `scripts/generate-static-pages.js` 中的 `generateSitemap` 函数来修改sitemap的生成规则。

## 注意事项

1. 确保Supabase连接正常
2. 脚本会覆盖 `out/` 目录下的现有文件
3. 生成的HTML页面是静态的，不会包含动态交互功能
4. 建议在部署前测试生成的页面

## 故障排除

### 常见问题

1. **Supabase连接失败**
   - 检查环境变量是否正确设置
   - 确认Supabase URL和密钥有效

2. **权限错误**
   - 确保脚本有写入 `out/` 目录的权限

3. **内容格式错误**
   - 检查Supabase中的数据结构是否符合预期

### 调试模式

在脚本中添加更多日志输出来调试问题：

```javascript
console.log('调试信息:', data);
```
