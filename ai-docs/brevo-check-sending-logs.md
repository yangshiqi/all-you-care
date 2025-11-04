# 如何在 Brevo 后台查看发送日志

## 查看 Transactional Email（事务性邮件）发送日志

### 方法 1：通过 Statistics（统计）页面

1. **登录 Brevo 后台**
   - 访问：https://app.brevo.com/
   - 使用您的账户登录

2. **进入 Statistics（统计）页面**
   - 在左侧导航栏找到 **"Statistics"**（统计）或 **"Reports"**（报告）
   - 点击进入

3. **选择 Transactional Emails（事务性邮件）**
   - 在统计页面中，找到 **"Transactional Emails"**（事务性邮件）标签
   - 点击进入事务性邮件统计页面

4. **查看发送记录**
   - 您可以看到所有通过 API 发送的邮件记录
   - 显示信息包括：
     - 发送时间
     - 收件人邮箱
     - 邮件主题
     - 发送状态（已发送、已送达、已打开、已点击等）
     - 错误信息（如果有）

### 方法 2：通过 SMTP & API 页面

1. **进入 SMTP & API 设置**
   - 左侧导航栏 → **"Settings"**（设置）
   - 选择 **"SMTP & API"**

2. **查看 API 使用情况**
   - 在 SMTP & API 页面可以看到 API 调用统计
   - 包括每日发送量、成功率等

### 方法 3：通过 Email Logs（邮件日志）

1. **直接访问邮件日志**
   - 左侧导航栏 → **"Statistics"** → **"Email Logs"**（邮件日志）
   - 或直接访问：https://app.brevo.com/statistics/transactional

2. **筛选和搜索**
   - 可以按日期范围筛选
   - 可以搜索特定的收件人邮箱
   - 可以按状态筛选（成功、失败、待发送等）

## 查看 Campaign（营销活动）发送日志

如果您的邮件是通过 Campaign 发送的：

1. **进入 Campaigns 页面**
   - 左侧导航栏 → **"Campaigns"**（营销活动）

2. **选择您的 Campaign**
   - 找到 campaign ID 为 6 的活动
   - 点击进入详情页

3. **查看统计信息**
   - 在 Campaign 详情页可以看到：
     - 发送状态
     - 收件人列表
     - 打开率、点击率等

## 重要信息说明

### 发送状态说明

- **Sent（已发送）**：邮件已成功发送到邮件服务器
- **Delivered（已送达）**：邮件已成功送达收件人邮箱
- **Opened（已打开）**：收件人已打开邮件
- **Clicked（已点击）**：收件人点击了邮件中的链接
- **Bounced（退回）**：邮件被退回（可能是邮箱不存在等）
- **Failed（失败）**：发送失败（会在错误信息中显示原因）

### 常见错误信息

- **Invalid sender email**：发件人邮箱未验证
- **Invalid recipient**：收件人邮箱格式错误
- **Rate limit exceeded**：超过发送速率限制
- **Insufficient credits**：账户余额不足（如果是付费计划）

## 调试建议

1. **检查发送状态**
   - 如果显示 "Sent" 但未收到，检查垃圾邮件文件夹
   - 如果显示 "Failed"，查看错误信息

2. **验证发件人邮箱**
   - 确保发件人邮箱已在 Brevo 中验证
   - Settings → SMTP & API → Sender Management

3. **检查域名验证**
   - 如果要使用自定义域名，需要配置 SPF、DKIM 等 DNS 记录
   - Settings → Sender & IP → Domains

## 快速访问链接

- **Transactional Emails 统计**：https://app.brevo.com/statistics/transactional
- **Email Logs**：https://app.brevo.com/statistics/transactional
- **Campaigns**：https://app.brevo.com/campaigns
- **SMTP & API 设置**：https://app.brevo.com/settings/smtp-api

## 使用 API 查询发送状态

您也可以通过 Brevo API 查询邮件发送状态：

```bash
# 获取事务性邮件事件
GET https://api.brevo.com/v3/smtp/events?messageId={messageId}
```

在代码中，我们已经记录了 `messageId`，可以使用它来查询发送状态。

