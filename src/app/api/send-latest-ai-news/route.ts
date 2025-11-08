import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * 获取 Brevo Campaign 的收件人列表
 */
async function getCampaignRecipients(campaignId: number, apiKey: string) {
  const campaignUrl = `https://api.brevo.com/v3/emailCampaigns/${campaignId}`;
  
  try {
    const response = await fetch(campaignUrl, {
      method: 'GET',
      headers: {
        'api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get campaign: ${response.status} - ${errorText}`);
    }

    const campaignData = await response.json();
    
    // Campaign 通常包含 listIds，我们需要从列表中获取联系人
    const listIds = campaignData.recipients?.lists || [];
    
    if (listIds.length === 0) {
      throw new Error('Campaign has no recipient lists');
    }

    // 获取所有列表中的联系人
    const allContacts: Array<{ email: string; attributes?: Record<string, string> }> = [];
    
    for (const listId of listIds) {
      const contacts = await getListContacts(listId, apiKey);
      allContacts.push(...contacts);
    }

    // 去重（基于邮箱）
    const uniqueContacts = Array.from(
      new Map(allContacts.map(contact => [contact.email, contact])).values()
    );

    return uniqueContacts;
  } catch (error) {
    console.error('Error getting campaign recipients:', error);
    throw error;
  }
}

/**
 * 获取列表中的所有联系人
 */
async function getListContacts(listId: number, apiKey: string) {
  const contactsUrl = `https://api.brevo.com/v3/contacts/lists/${listId}/contacts`;
  
  try {
    const contacts: Array<{ email: string; attributes?: Record<string, string> }> = [];
    let offset = 0;
    const limit = 50; // 每次获取 50 个联系人
    
    while (true) {
      const response = await fetch(`${contactsUrl}?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'api-key': apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get contacts: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const listContacts = data.contacts || [];
      
      if (listContacts.length === 0) {
        break;
      }

      // 提取邮箱和属性
      for (const contact of listContacts) {
        if (contact.email) {
          contacts.push({
            email: contact.email,
            attributes: contact.attributes || {},
          });
        }
      }

      offset += limit;
      
      // 如果没有更多数据，退出循环
      if (listContacts.length < limit) {
        break;
      }
    }

    return contacts;
  } catch (error) {
    console.error(`Error getting contacts from list ${listId}:`, error);
    throw error;
  }
}

/**
 * 从 Supabase 获取最后一个 lang=zh_CN 的记录
 */
async function getLatestZhCNContent() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase 环境变量未配置: NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from('n8n-ai-contents')
    .select('*')
    .eq('lang', 'zh_CN')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('未找到 lang=zh_CN 的记录');
    }
    console.error('Error fetching latest content:', error);
    throw new Error(`Failed to fetch latest content: ${error.message}`);
  }

  return data;
}

/**
 * 通过 Brevo Transactional Email API 发送邮件
 */
async function sendTransactionalEmail(
  recipients: Array<{ email: string; attributes?: Record<string, string> }>,
  subject: string,
  htmlContent: string,
  textContent: string | undefined,
  senderEmail: string,
  senderName: string,
  apiKey: string
) {
  const sendEmailUrl = 'https://api.brevo.com/v3/smtp/email';
  
  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ email: string; error: string }>,
    messageIds: [] as Array<{ email: string; messageId: string }>,
  };

  // 为每个收件人发送个性化邮件
  for (const recipient of recipients) {
    try {
      // 替换邮件内容中的占位符（如 {{FIRSTNAME}}, {{LASTNAME}} 等）
      let personalizedHtml = htmlContent;
      let personalizedText = textContent || '';
      let personalizedSubject = subject;

      if (recipient.attributes) {
        const placeholders: Record<string, string> = {
          '{{FIRSTNAME}}': recipient.attributes.FIRSTNAME || '',
          '{{LASTNAME}}': recipient.attributes.LASTNAME || '',
          '{{EMAIL}}': recipient.email,
        };

        // 替换 HTML 内容中的占位符
        for (const [placeholder, value] of Object.entries(placeholders)) {
          personalizedHtml = personalizedHtml.replace(new RegExp(placeholder, 'g'), value);
          personalizedText = personalizedText.replace(new RegExp(placeholder, 'g'), value);
          personalizedSubject = personalizedSubject.replace(new RegExp(placeholder, 'g'), value);
        }
      }

      const emailBody = {
        sender: {
          email: senderEmail,
          name: senderName,
        },
        to: [
          {
            email: recipient.email,
            name: recipient.attributes?.FIRSTNAME 
              ? `${recipient.attributes.FIRSTNAME} ${recipient.attributes.LASTNAME || ''}`.trim()
              : recipient.email,
          },
        ],
        subject: personalizedSubject,
        htmlContent: personalizedHtml,
        ...(personalizedText && { textContent: personalizedText }),
      };

      const response = await fetch(sendEmailUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify(emailBody),
      });

      // 先获取响应文本，然后尝试解析 JSON
      const responseText = await response.text();
      let responseData: { messageId?: string; message?: string } = {};
      
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch {
        console.error(`Failed to parse response for ${recipient.email}:`, responseText);
      }

      if (!response.ok) {
        const errorMsg = responseData.message || responseText || `HTTP ${response.status}`;
        console.error(`Failed to send email to ${recipient.email}:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorMsg,
          responseData,
        });
        throw new Error(errorMsg);
      }

      // 记录成功发送的详细信息
      const messageId = responseData.messageId;
      console.log(`✅ Email sent successfully to ${recipient.email}:`, {
        messageId,
        response: responseData,
      });

      if (messageId) {
        results.messageIds.push({
          email: recipient.email,
          messageId: String(messageId),
        });
      }

      results.success++;
      
      // 添加小延迟避免 API 速率限制
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      results.failed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push({
        email: recipient.email,
        error: errorMessage,
      });
      console.error(`Failed to send email to ${recipient.email}:`, errorMessage);
    }
  }

  return results;
}

/**
 * GET 或 POST 请求处理
 * 支持通过查询参数或请求体传递 campaignId
 */
export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  try {
    console.log('📧 开始发送最新的 AI 新闻给邮件订阅者...\n');

    // 检查环境变量
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      console.error('❌ 错误: 未找到 BREVO_API_KEY 环境变量');
      return NextResponse.json(
        { error: 'BREVO_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ 错误: 未找到 Supabase 环境变量');
      return NextResponse.json(
        { error: 'Supabase environment variables are not configured' },
        { status: 500 }
      );
    }

    // 获取 campaignId，默认值为 6
    const searchParams = request.nextUrl.searchParams;
    let campaignId = 6;
    
    if (searchParams.has('campaignId')) {
      campaignId = parseInt(searchParams.get('campaignId') || '6', 10);
    } else if (request.method === 'POST') {
      try {
        const body = await request.json();
        campaignId = body.campaignId || 6;
      } catch {
        // 如果解析失败，使用默认值
      }
    }

    console.log(`📋 Campaign ID: ${campaignId}\n`);

    // 1. 获取最新的中文内容
    console.log('📰 正在从 Supabase 获取最新的中文内容...');
    const latestContent = await getLatestZhCNContent();
    console.log('✅ 获取到最新内容:');
    console.log(`   标题: ${latestContent.title}`);
    console.log(`   创建时间: ${latestContent.created_at}`);
    console.log(`   内容长度: ${latestContent.content?.length || 0} 字符\n`);

    if (!latestContent.title || !latestContent.content) {
      throw new Error('获取的内容缺少标题或内容');
    }

    // 2. 获取订阅者邮件列表
    console.log(`📬 正在获取 Campaign ${campaignId} 的订阅者邮件列表...`);
    const recipients = await getCampaignRecipients(campaignId, brevoApiKey);
    console.log(`✅ 找到 ${recipients.length} 个订阅者\n`);

    if (recipients.length === 0) {
      console.error('❌ 错误: 未找到订阅者');
      return NextResponse.json(
        { error: 'No recipients found for this campaign' },
        { status: 404 }
      );
    }

    // 3. 发送邮件
    console.log('📤 开始发送邮件...\n');
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'yangshiqi1089@gmail.com';
    const senderName = process.env.BREVO_SENDER_NAME || '[AI]News';
    
    const sendResults = await sendTransactionalEmail(
      recipients,
      latestContent.title, // 使用记录的 title 作为邮件标题
      latestContent.content, // 使用记录的 content 作为邮件内容
      undefined, // 不提供纯文本版本
      senderEmail,
      senderName,
      brevoApiKey
    );

    // 4. 输出结果
    console.log('\n📊 发送结果汇总:');
    console.log(`   总收件人数: ${recipients.length}`);
    console.log(`   ✅ 成功发送: ${sendResults.success}`);
    console.log(`   ❌ 发送失败: ${sendResults.failed}`);

    if (sendResults.errors.length > 0) {
      console.log('\n❌ 发送失败的邮箱:');
      sendResults.errors.forEach((err) => {
        console.log(`   - ${err.email}: ${err.error}`);
      });
    }

    if (sendResults.messageIds.length > 0) {
      console.log(`\n📝 成功发送的邮件 ID (前10个):`);
      sendResults.messageIds.slice(0, 10).forEach((item) => {
        console.log(`   - ${item.email}: ${item.messageId}`);
      });
      if (sendResults.messageIds.length > 10) {
        console.log(`   ... 还有 ${sendResults.messageIds.length - 10} 个`);
      }
    }

    console.log('\n✅ 邮件发送任务完成！');

    return NextResponse.json(
      {
        success: true,
        message: `Email sending completed. Success: ${sendResults.success}, Failed: ${sendResults.failed}`,
        campaignId,
        totalRecipients: recipients.length,
        successCount: sendResults.success,
        failedCount: sendResults.failed,
        latestContent: {
          title: latestContent.title,
          createdAt: latestContent.created_at,
        },
        messageIds: sendResults.messageIds.length > 0 ? sendResults.messageIds.slice(0, 10) : undefined,
        errors: sendResults.errors.length > 0 ? sendResults.errors : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('\n❌ 执行失败:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';
    
    return NextResponse.json(
      {
        error: 'Failed to send latest AI news',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

