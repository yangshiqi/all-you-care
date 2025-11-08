#!/usr/bin/env node

/**
 * 测试发送 Campaign 邮件 API
 * 用法: node scripts/test-send-campaign-email.js [campaignId] [subject] [htmlContent]
 */

// 加载环境变量（使用 Node.js 内置的 fs 模块）
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          // 移除引号
          const cleanValue = value.replace(/^["']|["']$/g, '');
          process.env[key.trim()] = cleanValue;
        }
      }
    }
  } catch (error) {
    // 文件不存在时忽略错误
  }
}

// 加载环境变量文件
loadEnvFile(path.join(__dirname, '..', '.env.local'));
loadEnvFile(path.join(__dirname, '..', '.env'));

const campaignId = parseInt(process.argv[2]) || 6;
const subject = process.argv[3] || '测试邮件 - {{FIRSTNAME}}';
const htmlContent = process.argv[4] || '<h1>你好 {{FIRSTNAME}} {{LASTNAME}}!</h1><p>这是一封测试邮件，发送到 {{EMAIL}}</p>';

async function testSendCampaignEmail() {
  console.log('🧪 测试发送 Campaign 邮件 API...\n');
  console.log('测试参数:');
  console.log(`  Campaign ID: ${campaignId}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  HTML Content: ${htmlContent.substring(0, 50)}...\n`);

  // 检查环境变量
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey) {
    console.error('❌ 错误: 未找到 BREVO_API_KEY 环境变量');
    console.error('请确保在 .env 文件中设置了 BREVO_API_KEY');
    process.exit(1);
  }

  console.log('✅ 环境变量 BREVO_API_KEY 已配置');
  console.log(`   API Key 前10个字符: ${brevoApiKey.substring(0, 10)}...\n`);

  // 测试 API 端点
  const apiUrl = process.argv[5] || 'http://localhost:3000/api/send-campaign-email/';
  
  console.log(`📡 正在调用 API: ${apiUrl}\n`);

  const requestBody = {
    campaignId,
    subject,
    htmlContent,
    textContent: '你好 {{FIRSTNAME}} {{LASTNAME}}! 这是一封测试邮件，发送到 {{EMAIL}}',
    senderEmail: process.env.BREVO_SENDER_EMAIL || 'yangshiqi1089@gmail.com',
    senderName: process.env.BREVO_SENDER_NAME || '[AI]News',
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    console.log(`📊 响应状态: ${response.status} ${response.statusText}`);
    console.log('📦 响应数据:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ 邮件发送成功！');
      console.log(`   总收件人数: ${data.totalRecipients}`);
      console.log(`   成功发送: ${data.successCount}`);
      console.log(`   发送失败: ${data.failedCount}`);
      if (data.errors && data.errors.length > 0) {
        console.log('\n❌ 发送失败的邮箱:');
        data.errors.forEach((err) => {
          console.log(`   - ${err.email}: ${err.error}`);
        });
      }
    } else {
      console.log('\n❌ 邮件发送失败');
      if (data.error) {
        console.log(`   错误: ${data.error}`);
      }
      if (data.message) {
        console.log(`   消息: ${data.message}`);
      }
    }
  } catch (error) {
    console.error('\n❌ 请求失败:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 提示: 请确保开发服务器正在运行');
      console.error('   运行: npm run dev');
    }
    process.exit(1);
  }
}

testSendCampaignEmail();

