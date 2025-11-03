#!/usr/bin/env node

/**
 * 测试 HubSpot 订阅 API
 * 用法: node scripts/test-subscribe-api.js [email] [firstName] [lastName]
 */

// 加载环境变量
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const testEmail = process.argv[2] || 'test@example.com';
const firstName = process.argv[3] || 'Test';
const lastName = process.argv[4] || 'User';

async function testSubscribeAPI() {
  console.log('🧪 测试 HubSpot 订阅 API...\n');
  console.log('测试数据:');
  console.log(`  Email: ${testEmail}`);
  console.log(`  First Name: ${firstName}`);
  console.log(`  Last Name: ${lastName}\n`);

  // 检查环境变量
  const hubspotToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!hubspotToken) {
    console.error('❌ 错误: 未找到 HUBSPOT_ACCESS_TOKEN 环境变量');
    console.error('请确保在 .env.local 文件中设置了 HUBSPOT_ACCESS_TOKEN');
    process.exit(1);
  }

  console.log('✅ 环境变量 HUBSPOT_ACCESS_TOKEN 已配置');
  console.log(`   Token 前10个字符: ${hubspotToken.substring(0, 10)}...\n`);

  // 测试 API 端点
  const apiUrl = process.argv[5] || 'http://localhost:3000/api/subscribe';
  
  console.log(`📡 正在调用 API: ${apiUrl}\n`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        firstName: firstName,
        lastName: lastName,
      }),
    });

    const data = await response.json();

    console.log(`📊 响应状态: ${response.status} ${response.statusText}`);
    console.log('📦 响应数据:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ 订阅成功！');
      if (data.contactId) {
        console.log(`   联系人 ID: ${data.contactId}`);
      }
    } else {
      console.log('\n❌ 订阅失败');
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

testSubscribeAPI();

