# 发送最新 AI 新闻脚本实现（2025-01-XX）

## 背景

需要实现一个自动化脚本，能够定期将最新的 AI 新闻发送给邮件订阅者。脚本需要：
1. 从 Brevo Campaign 获取订阅者邮件列表
2. 从 Supabase 获取最新的中文内容
3. 批量发送邮件给所有订阅者

## 实现方案

### 脚本位置
`scripts/send-latest-ai-news.js`

### 核心功能

#### 1. 获取订阅者邮件列表
- 使用 `getCampaignRecipients` 函数从 Brevo Campaign API 获取订阅者
- 支持从多个联系人列表中获取并去重
- 返回包含邮箱和属性的联系人数组

#### 2. 获取最新中文内容
- 从 Supabase `n8n-ai-contents` 表查询
- 筛选条件：`lang = 'zh_CN'` 且 `is_published = false`
- 排序：按 `created_at` 降序
- 限制：只获取第一条记录

#### 3. 批量发送邮件
- 使用 Brevo Transactional Email API 发送邮件
- 支持邮件内容个性化（替换占位符如 `{{FIRSTNAME}}`, `{{LASTNAME}}`, `{{EMAIL}}`）
- 邮件标题使用记录的 `title` 字段
- 邮件内容使用记录的 `content` 字段
- 包含错误处理和重试机制
- 添加延迟避免 API 速率限制

#### 4. 更新发布状态
- 邮件发送成功后，自动更新对应记录的 `is_published` 字段为 `true`
- 使用 `updateIsPublished` 函数更新 Supabase 记录
- 更新失败不会影响邮件发送流程（仅记录警告）
- 确保已发送的内容不会被重复发送

### 技术实现

#### 依赖
- Node.js 内置模块：`fs`, `path`
- Supabase 客户端：`@supabase/supabase-js`
- Fetch API（Node.js 18+ 内置）

#### 环境变量
```bash
# Brevo 配置
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=your-sender-email@example.com  # 可选
BREVO_SENDER_NAME=AINews                          # 可选

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### 使用方法
```bash
# 使用默认 campaign ID (6)
node scripts/send-latest-ai-news.js

# 指定 campaign ID
node scripts/send-latest-ai-news.js 6
```

### 功能特性

1. **自动加载环境变量**
   - 支持从 `.env.local` 和 `.env` 文件加载
   - 自动处理引号和注释

2. **完整的错误处理**
   - 环境变量检查
   - API 调用错误处理
   - 详细的错误日志输出

3. **进度跟踪**
   - 实时显示发送进度
   - 成功/失败统计
   - 详细的发送结果报告

4. **性能优化**
   - 批量获取联系人（每次 50 个）
   - 邮件发送延迟（100ms）避免速率限制
   - 去重处理避免重复发送

### 输出示例

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
✅ Email sent successfully to user1@example.com
✅ Email sent successfully to user2@example.com
...

📊 发送结果汇总:
   总收件人数: 100
   ✅ 成功发送: 98
   ❌ 发送失败: 2

❌ 发送失败的邮箱:
   - user3@example.com: Invalid email address
   - user4@example.com: Rate limit exceeded

📝 成功发送的邮件 ID (前10个):
   - user1@example.com: message-id-123
   - user2@example.com: message-id-124
   ...

🔄 正在更新记录状态（is_published = true）...
✅ 成功更新记录 record-id-123 的 is_published 字段为 true

✅ 邮件发送任务完成！
```

### 错误处理

脚本会处理以下错误情况：
- 环境变量缺失
- Supabase 连接失败
- 未找到中文内容记录
- Brevo API 调用失败
- 邮件发送失败（单个收件人失败不影响其他收件人）

### 注意事项

1. **API 速率限制**
   - Brevo API 有速率限制，脚本已添加延迟
   - 大量订阅者时可能需要较长时间

2. **内容格式**
   - 邮件内容使用 HTML 格式（`content` 字段）
   - 确保 `content` 字段包含有效的 HTML

3. **Campaign 配置**
   - 确保 Campaign 已配置联系人列表
   - Campaign ID 必须有效

4. **Supabase 数据**
   - 确保存在 `lang=zh_CN` 且 `is_published=false` 的记录
   - 记录的 `title` 和 `content` 字段不能为空
   - 确保表中有 `is_published` 布尔字段
   - 确保 Supabase 有更新权限（RLS 策略允许更新）

### 后续优化建议

1. **定时任务**
   - 可以配置 cron 任务定期执行
   - 或使用 GitHub Actions、Vercel Cron 等

2. **邮件模板**
   - 可以添加邮件模板支持
   - 美化邮件格式

3. **发送记录**
   - ✅ 已实现：通过 `is_published` 字段标记已发送内容
   - 邮件发送成功后自动更新 `is_published = true`
   - 下次查询时自动排除已发布的内容，避免重复发送

4. **批量优化**
   - 支持更大的批量发送
   - 优化 API 调用频率

5. **通知机制**
   - 发送完成后发送通知（如 Slack、邮件）
   - 记录发送日志到数据库

## 相关文件

- `scripts/send-latest-ai-news.js` - 主脚本文件
- `scripts/README.md` - 脚本使用说明
- `src/app/api/send-campaign-email/route.ts` - 参考实现（API 路由版本）

