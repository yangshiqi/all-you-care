#!/usr/bin/env node

/**
 * 直接测试 Brevo API 发送邮件
 * 用于调试邮件发送问题
 */

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
          const cleanValue = value.replace(/^["']|["']$/g, '');
          process.env[key.trim()] = cleanValue;
        }
      }
    }
  } catch (error) {
    // 文件不存在时忽略错误
  }
}

loadEnvFile(path.join(__dirname, '..', '.env.local'));
loadEnvFile(path.join(__dirname, '..', '.env'));

const apiKey = process.env.BREVO_API_KEY;
const testEmail = process.argv[2] || process.env.TEST_EMAIL || 'your-email@example.com';

if (!apiKey) {
  console.error('❌ 错误: 未找到 BREVO_API_KEY 环境变量');
  process.exit(1);
}

async function testSendEmail() {
  console.log('🧪 直接测试 Brevo API 发送邮件...\n');
  console.log(`测试邮箱: ${testEmail}`);
  console.log(`API Key: ${apiKey.substring(0, 10)}...\n`);

  const sendEmailUrl = 'https://api.brevo.com/v3/smtp/email';
  
  const emailBody = {
    sender: {
      email: process.env.BREVO_SENDER_EMAIL || 'yangshiqi1089@gmail.com',
      name: process.env.BREVO_SENDER_NAME || 'AINews',
    },
    to: [
      {
        email: testEmail,
        name: 'Test User',
      },
    ],
    subject: '测试邮件 - Brevo API 直接测试',
    htmlContent: '<h1>测试邮件</h1><p>这是一封直接从 Brevo API 发送的测试邮件。</p><p>如果您收到这封邮件，说明 Brevo API 配置正确。</p>',
    textContent: '测试邮件\n\n这是一封直接从 Brevo API 发送的测试邮件。\n\n如果您收到这封邮件，说明 Brevo API 配置正确。',
  };

  console.log('📧 邮件内容:');
  console.log(JSON.stringify(emailBody, null, 2));
  console.log('\n📡 正在发送...\n');

  try {
    const response = await fetch(sendEmailUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(emailBody),
    });

    const responseText = await response.text();
    console.log(`📊 HTTP 状态: ${response.status} ${response.statusText}`);
    console.log('📦 响应内容:');
    
    try {
      const responseData = JSON.parse(responseText);
      console.log(JSON.stringify(responseData, null, 2));
      
      if (response.ok) {
        console.log('\n✅ 邮件发送请求成功！');
        console.log(`   消息 ID: ${responseData.messageId || 'N/A'}`);
        console.log('\n💡 注意事项:');
        console.log('   1. 请检查您的邮箱（包括垃圾邮件文件夹）');
        console.log('   2. 确保发件人邮箱已在 Brevo 中验证');
        console.log('   3. 如果未收到邮件，请检查 Brevo 后台的发送日志');
        
        if (emailBody.sender.email === 'noreply@example.com') {
          console.log('\n⚠️  警告: 使用了默认发件人邮箱 noreply@example.com');
          console.log('   请在 Brevo 后台验证您的发件人域名，或设置 BREVO_SENDER_EMAIL 环境变量');
        }
      } else {
        console.log('\n❌ 邮件发送失败');
        console.log(`   错误: ${responseData.message || responseText}`);
        
        if (response.status === 400) {
          console.log('\n💡 可能的原因:');
          console.log('   - 发件人邮箱未在 Brevo 中验证');
          console.log('   - 邮件内容格式不正确');
          console.log('   - 收件人邮箱格式不正确');
        }
      }
    } catch (parseError) {
      console.log(responseText);
      console.log('\n⚠️  响应不是有效的 JSON');
    }
  } catch (error) {
    console.error('\n❌ 请求失败:', error.message);
    process.exit(1);
  }
}

testSendEmail();

