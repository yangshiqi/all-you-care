import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * 模式配置
 */
const MODES = {
  ai: {
    campaignId: 6,
    tableName: 'n8n-ai-contents',
    displayName: 'AI',
    senderName: '[AI]News',
    // 时间限制：null 表示无限制
    timeRestriction: null,
  },
  snow: {
    campaignId: 10,
    tableName: 'n8n-good-contents',
    displayName: 'Snow',
    senderName: '[Snow]News',
    // 时间限制：只能在周三和周五的早上 8:00-9:00 之间执行
    // allowedDays: 0=周日, 1=周一, 2=周二, 3=周三, 4=周四, 5=周五, 6=周六
    // allowedHours: { start: 8, end: 9 } 表示 8:00-8:59（包含开始时间，不包含结束时间）
    timeRestriction: {
      allowedDays: [3, 5], // 周三和周五
      allowedHours: { start: 8, end: 9 }, // 8:00-8:59（即 8:00 到 8:59:59）
    },
  },
} as const;

type ModeType = keyof typeof MODES;

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
 * @param table - 表名（n8n-ai-contents 或 n8n-good-contents）
 */
async function getLatestZhCNContent(table: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase 环境变量未配置: NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('lang', 'zh_CN')
    .eq('is_published', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error(`未找到 lang=zh_CN 且 is_published=false 的记录（表: ${table}）`);
    }
    console.error('Error fetching latest content:', error);
    throw new Error(`Failed to fetch latest content: ${error.message}`);
  }

  return data;
}

/**
 * 更新 Supabase 表中记录的 is_published 字段为 true
 * @param table - 表名（n8n-ai-contents 或 n8n-good-contents）
 * @param recordId - 记录 ID
 */
async function updateIsPublished(table: string, recordId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase 环境变量未配置: NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from(table)
    .update({ is_published: true })
    .eq('id', recordId)
    .select()
    .single();

  if (error) {
    console.error('Error updating is_published:', error);
    throw new Error(`Failed to update is_published: ${error.message}`);
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
 * 时间限制配置类型
 */
type TimeRestriction = {
  allowedDays: readonly number[] | number[];
  allowedHours: { readonly start: number; readonly end: number } | { start: number; end: number };
} | null;

/**
 * 检查当前时间是否在允许的时间范围内
 * @param timeRestriction - 时间限制配置
 * @returns { allowed: boolean, reason: string | null }
 */
function checkTimeRestriction(timeRestriction: TimeRestriction) {
  // 如果没有时间限制，允许执行
  if (!timeRestriction) {
    return { allowed: true, reason: null };
  }

  const now = new Date();
  const currentDay = now.getDay(); // 0=周日, 1=周一, ..., 6=周六
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // 检查星期几
  if (timeRestriction.allowedDays && !timeRestriction.allowedDays.includes(currentDay)) {
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const allowedDayNames = timeRestriction.allowedDays.map((d: number) => dayNames[d]).join('、');
    return {
      allowed: false,
      reason: `当前是${dayNames[currentDay]}，只允许在${allowedDayNames}执行`,
    };
  }

  // 检查时间段
  if (timeRestriction.allowedHours) {
    const { start, end } = timeRestriction.allowedHours;
    const currentTime = currentHour * 60 + currentMinute; // 转换为分钟数
    const startTime = start * 60;
    const endTime = end * 60;

    if (currentTime < startTime || currentTime >= endTime) {
      return {
        allowed: false,
        reason: `当前时间是 ${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}，只允许在 ${String(start).padStart(2, '0')}:00-${String(end).padStart(2, '0')}:59 之间执行`,
      };
    }
  }

  return { allowed: true, reason: null };
}

/**
 * 执行单个模式的邮件发送任务
 * @param mode - 模式名称（ai 或 snow）
 */
async function executeMode(mode: ModeType) {
  const modeConfig = MODES[mode];
  const { campaignId, tableName, displayName, senderName: defaultSenderName, timeRestriction } = modeConfig;

  // 检查时间限制
  const timeCheck = checkTimeRestriction(timeRestriction);
  if (!timeCheck.allowed) {
    return {
      mode,
      success: false,
      skipped: true,
      reason: timeCheck.reason,
    };
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📧 开始发送最新的 ${displayName} 新闻给邮件订阅者...`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📋 模式: ${mode}`);
  console.log(`📋 Campaign ID: ${campaignId}`);
  console.log(`📋 表名: ${tableName}\n`);

  // 检查环境变量
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey) {
    throw new Error('未找到 BREVO_API_KEY 环境变量');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('未找到 Supabase 环境变量');
  }

  // 1. 获取最新的中文内容
  console.log(`📰 正在从 Supabase 表 ${tableName} 获取最新的中文内容...`);
  const latestContent = await getLatestZhCNContent(tableName);
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
    throw new Error('未找到订阅者');
  }

  // 3. 发送邮件
  console.log('📤 开始发送邮件...\n');
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'yangshiqi1089@gmail.com';
  const senderName = process.env.BREVO_SENDER_NAME || defaultSenderName;
  
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

  // 5. 如果邮件发送成功，更新 is_published 字段为 true
  if (sendResults.success > 0) {
    console.log(`\n🔄 正在更新记录状态（is_published = true）...`);
    try {
      await updateIsPublished(tableName, latestContent.id);
      console.log(`✅ 成功更新记录 ${latestContent.id} 的 is_published 字段为 true`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ 更新 is_published 字段失败: ${errorMessage}`);
      // 不抛出错误，因为邮件已经发送成功，更新失败不应该影响整体流程
      console.warn('⚠️  警告: 邮件已发送，但更新发布状态失败，请手动检查数据库');
    }
  } else {
    console.log('\n⚠️  没有成功发送的邮件，跳过更新 is_published 字段');
  }

  console.log(`\n✅ ${displayName} 模式邮件发送任务完成！`);
  
  return {
    mode,
    success: true,
    results: sendResults,
    latestContent: {
      title: latestContent.title,
      createdAt: latestContent.created_at,
    },
  };
}

/**
 * GET 或 POST 请求处理
 * 支持通过查询参数 type 选择模式（ai 或 snow）
 * 如果不传 type，则遍历所有模式执行
 */
export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  try {
    console.log('🚀 邮件发送 API 启动\n');

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

    // 获取 type 参数，支持通过查询参数或请求体传递
    const searchParams = request.nextUrl.searchParams;
    let typeArg: string | null = null;
    
    if (searchParams.has('type')) {
      typeArg = searchParams.get('type')?.toLowerCase() || null;
    } else if (request.method === 'POST') {
      try {
        const body = await request.json();
        typeArg = body.type?.toLowerCase() || null;
      } catch {
        // 如果解析失败，使用默认值
      }
    }

    // 验证 type 参数
    if (typeArg && !(typeArg in MODES)) {
      return NextResponse.json(
        { 
          error: `无效的 type 参数 "${typeArg}"，只支持 "ai" 或 "snow"`,
          usage: {
            '不传参数': '遍历所有模式（ai 和 snow）',
            'ai': '执行 ai 模式',
            'snow': '执行 snow 模式',
          }
        },
        { status: 400 }
      );
    }

    // 确定要执行的模式列表
    const modesToExecute: ModeType[] = typeArg ? [typeArg as ModeType] : (Object.keys(MODES) as ModeType[]);

    if (modesToExecute.length > 1) {
      console.log(`📋 将依次执行 ${modesToExecute.length} 个模式: ${modesToExecute.join(', ')}\n`);
    }

    const allResults: Array<{
      mode: ModeType;
      success: boolean;
      skipped?: boolean;
      reason?: string | null;
      error?: string;
      results?: {
        success: number;
        failed: number;
        errors: Array<{ email: string; error: string }>;
        messageIds: Array<{ email: string; messageId: string }>;
      };
      latestContent?: {
        title: string;
        createdAt: string;
      };
    }> = [];
    let hasError = false;

    for (let i = 0; i < modesToExecute.length; i++) {
      const mode = modesToExecute[i];
      
      try {
        const result = await executeMode(mode);
        allResults.push(result);
        
        // 如果模式被跳过，显示跳过信息
        if (result.skipped) {
          console.log(`\n⏭️  ${MODES[mode].displayName} 模式已跳过`);
          console.log(`   原因: ${result.reason}`);
        }
        
        // 如果不是最后一个模式，添加分隔符
        if (i < modesToExecute.length - 1) {
          console.log('\n');
        }
      } catch (error) {
        hasError = true;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`\n❌ ${MODES[mode].displayName} 模式执行失败:`, errorMessage);
        if (error instanceof Error && error.stack) {
          console.error('\n错误堆栈:');
          console.error(error.stack);
        }
        
        allResults.push({
          mode,
          success: false,
          skipped: false,
          error: errorMessage,
        });
        
        // 如果不是最后一个模式，继续执行下一个
        if (i < modesToExecute.length - 1) {
          console.log('\n');
        }
      }
    }

    // 输出总体结果汇总
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 总体执行结果汇总');
    console.log(`${'='.repeat(60)}`);
    
    allResults.forEach((result) => {
      const modeConfig = MODES[result.mode];
      if (result.skipped) {
        console.log(`⏭️  ${modeConfig.displayName} 模式: 已跳过`);
        console.log(`   原因: ${result.reason}`);
      } else if (result.success && result.results) {
        console.log(`✅ ${modeConfig.displayName} 模式: 成功`);
        console.log(`   成功发送: ${result.results.success}, 失败: ${result.results.failed}`);
      } else {
        console.log(`❌ ${modeConfig.displayName} 模式: 失败`);
        console.log(`   错误: ${result.error}`);
      }
    });

    const successCount = allResults.filter(r => r.success).length;
    const skippedCount = allResults.filter(r => r.skipped).length;
    const totalCount = allResults.length;
    
    console.log(`\n总计: ${successCount}/${totalCount} 个模式执行成功`);
    if (skippedCount > 0) {
      console.log(`      ${skippedCount} 个模式因时间限制跳过`);
    }
    
    if (hasError) {
      console.log('\n⚠️  部分模式执行失败，请检查上面的错误信息');
    } else {
      console.log('\n🎉 所有模式执行完成！');
    }

    // 构建响应数据
    const responseData: {
      success: boolean;
      message: string;
      totalModes: number;
      successCount: number;
      skippedCount: number;
      results: Array<{
        mode: ModeType;
        displayName: string;
        success: boolean;
        skipped?: boolean;
        reason?: string | null;
        error?: string;
        totalRecipients?: number;
        successCount?: number;
        failedCount?: number;
        latestContent?: {
          title: string;
          createdAt: string;
        };
        messageIds?: Array<{ email: string; messageId: string }>;
        errors?: Array<{ email: string; error: string }>;
      }>;
    } = {
      success: !hasError,
      message: hasError 
        ? `部分模式执行失败。成功: ${successCount}/${totalCount}, 跳过: ${skippedCount}`
        : `所有模式执行完成。成功: ${successCount}/${totalCount}, 跳过: ${skippedCount}`,
      totalModes: totalCount,
      successCount,
      skippedCount,
      results: allResults.map(result => {
        const modeConfig = MODES[result.mode];
        return {
          mode: result.mode,
          displayName: modeConfig.displayName,
          success: result.success,
          skipped: result.skipped,
          reason: result.reason,
          error: result.error,
          totalRecipients: result.results ? result.results.success + result.results.failed : undefined,
          successCount: result.results?.success,
          failedCount: result.results?.failed,
          latestContent: result.latestContent,
          messageIds: result.results?.messageIds.length ? result.results.messageIds.slice(0, 10) : undefined,
          errors: result.results?.errors.length ? result.results.errors : undefined,
        };
      }),
    };

    return NextResponse.json(
      responseData,
      { status: hasError ? 207 : 200 } // 207 Multi-Status 表示部分成功
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

