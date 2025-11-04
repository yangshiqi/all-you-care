#!/usr/bin/env node

/**
 * 查询邮件发送状态和事件历史
 * 用法: node scripts/check-email-status.js <messageId>
 *   或: node scripts/check-email-status.js --email <email>
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
const messageId = process.argv[2];
const email = process.argv[3] === '--email' ? process.argv[4] : null;

if (!apiKey) {
  console.error('❌ 错误: 未找到 BREVO_API_KEY 环境变量');
  process.exit(1);
}

if (!messageId && !email) {
  console.error('❌ 用法: node scripts/check-email-status.js <messageId>');
  console.error('   或: node scripts/check-email-status.js --email <email>');
  console.error('\n示例:');
  console.error('   node scripts/check-email-status.js "202511031135.69929651882@smtp-relay.mailin.fr"');
  process.exit(1);
}

async function checkEmailStatus() {
  console.log('🔍 查询邮件发送状态...\n');
  
  if (messageId) {
    console.log(`📧 Message ID: ${messageId}`);
  } else {
    console.log(`📧 Email: ${email}`);
  }
  console.log('');

  // Brevo API 事件查询端点 - 注意 messageId 需要 URL 编码
  const eventsUrl = 'https://api.brevo.com/v3/smtp/statistics/events';
  const params = new URLSearchParams();
  
  if (messageId) {
    // messageId 格式：<202511031135.69929651882@smtp-relay.mailin.fr>
    // 需要编码特殊字符
    params.append('messageId', messageId);
  } else if (email) {
    params.append('email', email);
  }
  
  params.append('limit', '50');
  params.append('offset', '0');

  try {
    const response = await fetch(`${eventsUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'api-key': apiKey,
      },
    });

    const responseText = await response.text();
    console.log(`📊 HTTP 状态: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      console.error('❌ 查询失败');
      try {
        const errorData = JSON.parse(responseText);
        console.error(`   错误: ${errorData.message || responseText}`);
      } catch {
        console.error(`   错误: ${responseText}`);
      }
      process.exit(1);
    }

    const data = JSON.parse(responseText);
    const events = data.events || [];

    if (events.length === 0) {
      console.log('⚠️  未找到相关事件记录');
      console.log('   可能的原因:');
      console.log('   - 邮件刚刚发送，事件还未生成');
      console.log('   - Message ID 不正确');
      console.log('   - 邮件未成功发送');
      return;
    }

    // 按时间排序（最新的在前）
    events.sort((a, b) => {
      const dateA = new Date(a.date || a.date_time).getTime();
      const dateB = new Date(b.date || b.date_time).getTime();
      return dateB - dateA;
    });

    const statusMap = {
      'bounces': '退回',
      'hardBounces': '硬退回',
      'softBounces': '软退回',
      'delivered': '已送达',
      'opened': '已打开',
      'clicked': '已点击',
      'request': '请求发送',
      'deferred': '延迟',
      'complaint': '投诉',
      'blocked': '已阻止',
      'invalid': '无效',
      'unsubscribed': '已退订',
    };

    const latestEvent = events[0];
    const status = statusMap[latestEvent.event] || latestEvent.event;

    console.log('✅ 查询成功！\n');
    console.log('📊 邮件状态摘要:');
    console.log(`   最新状态: ${status}`);
    console.log(`   总事件数: ${events.length}`);
    console.log(`   已送达: ${events.filter(e => e.event === 'delivered').length}`);
    console.log(`   已打开: ${events.filter(e => e.event === 'opened').length}`);
    console.log(`   已点击: ${events.filter(e => e.event === 'clicked').length}`);
    console.log(`   退回: ${events.filter(e => e.event === 'bounces' || e.event === 'hardBounces' || e.event === 'softBounces').length}`);
    console.log('');

    console.log('📋 事件历史（按时间倒序）:');
    console.log('─'.repeat(80));
    
    events.forEach((event, index) => {
      const eventName = statusMap[event.event] || event.event;
      const date = new Date(event.date || event.date_time).toLocaleString('zh-CN');
      
      console.log(`\n${index + 1}. ${eventName} (${event.event})`);
      console.log(`   时间: ${date}`);
      
      if (event.reason) {
        console.log(`   原因: ${event.reason}`);
      }
      if (event.link) {
        console.log(`   链接: ${event.link}`);
      }
      if (event.ip) {
        console.log(`   IP: ${event.ip}`);
      }
      if (event.user_agent) {
        console.log(`   User Agent: ${event.user_agent}`);
      }
    });

    console.log('\n' + '─'.repeat(80));
    console.log('\n💡 提示: 您也可以在 Brevo 后台查看详细信息');
    console.log('   访问: https://app.brevo.com/statistics/transactional');
  } catch (error) {
    console.error('\n❌ 请求失败:', error.message);
    process.exit(1);
  }
}

checkEmailStatus();

