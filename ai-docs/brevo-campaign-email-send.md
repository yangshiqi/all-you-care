# Brevo Campaign 邮件发送功能

## 功能说明

该功能允许您：
1. 从 Brevo Campaign（活动）中获取收件人列表
2. 为收件人发送个性化邮件
3. 支持邮件内容中的占位符替换（如 `{{FIRSTNAME}}`, `{{LASTNAME}}`, `{{EMAIL}}`）

## API 端点

**POST** `/api/send-campaign-email/`

## 请求体

```json
{
  "campaignId": 6,  // 可选，默认为 6
  "subject": "邮件主题 - {{FIRSTNAME}}",
  "htmlContent": "<h1>你好 {{FIRSTNAME}} {{LASTNAME}}!</h1><p>邮件内容...</p>",
  "textContent": "纯文本版本（可选）",
  "senderEmail": "noreply@example.com",  // 可选，默认从环境变量读取
  "senderName": "AINews"  // 可选，默认从环境变量读取
}
```

## 响应格式

```json
{
  "success": true,
  "message": "Email sending completed. Success: 3, Failed: 0",
  "campaignId": 6,
  "totalRecipients": 3,
  "successCount": 3,
  "failedCount": 0,
  "errors": []  // 如果有失败的邮件，会列出错误信息
}
```

## 环境变量配置

在 `.env` 文件中配置：

```bash
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@example.com  # 可选
BREVO_SENDER_NAME=AINews  # 可选
```

## 占位符支持

邮件内容支持以下占位符：
- `{{FIRSTNAME}}` - 收件人的名字
- `{{LASTNAME}}` - 收件人的姓氏
- `{{EMAIL}}` - 收件人的邮箱地址

## 使用示例

### 使用 curl

```bash
curl -X POST http://localhost:3000/api/send-campaign-email/ \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": 6,
    "subject": "测试邮件 - {{FIRSTNAME}}",
    "htmlContent": "<h1>你好 {{FIRSTNAME}}!</h1><p>这是一封测试邮件。</p>"
  }'
```

### 使用测试脚本

```bash
node scripts/test-send-campaign-email.js 6 "邮件主题" "<h1>内容</h1>"
```

## 工作原理

1. **获取 Campaign 信息**：调用 Brevo API 获取指定 campaign 的详细信息
2. **提取收件人列表**：从 campaign 的 `recipients.lists` 中获取列表 ID
3. **获取联系人**：遍历所有列表，获取其中的联系人信息
4. **去重处理**：基于邮箱地址去重，避免重复发送
5. **个性化发送**：为每个收件人替换占位符，发送个性化邮件

## 注意事项

- 每次发送之间会有 100ms 的延迟，避免触发 Brevo API 速率限制
- 如果某个邮件发送失败，会在响应中的 `errors` 字段列出
- Campaign 必须包含至少一个收件人列表
- 确保发件人邮箱已在 Brevo 中验证

## 测试结果

✅ 已成功测试：
- 获取 campaign 6 的收件人列表
- 发送个性化邮件给所有收件人
- 占位符替换功能正常
