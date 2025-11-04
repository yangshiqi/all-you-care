import { NextRequest, NextResponse } from 'next/server';

interface SendCampaignEmailRequest {
  campaignId?: number;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  senderEmail?: string;
  senderName?: string;
}

/**
 * 获取 Brevo Campaign 的收件人列表
 * 文档：https://developers.brevo.com/reference/getemailcampaign
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
 * 文档：https://developers.brevo.com/reference/getcontactsfromlist
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
 * 通过 Brevo Transactional Email API 发送邮件
 * 文档：https://developers.brevo.com/reference/sendtransacemail
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

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'BREVO_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const body: SendCampaignEmailRequest = await request.json();
    
    // 默认 campaign ID 为 6
    const campaignId = body.campaignId || 6;
    
    // 验证必填字段
    if (!body.subject && !body.htmlContent) {
      return NextResponse.json(
        { error: 'Subject and htmlContent are required' },
        { status: 400 }
      );
    }

    // 默认发件人信息
    const senderEmail = body.senderEmail || process.env.BREVO_SENDER_EMAIL || 'noreply@example.com';
    const senderName = body.senderName || process.env.BREVO_SENDER_NAME || 'AINews';
    const subject = body.subject || 'Newsletter';
    const htmlContent = body.htmlContent || '<p>Hello!</p>';
    const textContent = body.textContent;

    console.log(`Getting recipients for campaign ${campaignId}...`);
    
    // 获取 campaign 的收件人列表
    const recipients = await getCampaignRecipients(campaignId, apiKey);
    
    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients found for this campaign' },
        { status: 404 }
      );
    }

    console.log(`Found ${recipients.length} recipients. Starting to send emails...`);

    // 发送邮件给所有收件人
    const sendResults = await sendTransactionalEmail(
      recipients,
      subject,
      htmlContent,
      textContent,
      senderEmail,
      senderName,
      apiKey
    );

    return NextResponse.json(
      {
        success: true,
        message: `Email sending completed. Success: ${sendResults.success}, Failed: ${sendResults.failed}`,
        campaignId,
        totalRecipients: recipients.length,
        successCount: sendResults.success,
        failedCount: sendResults.failed,
        messageIds: sendResults.messageIds.length > 0 ? sendResults.messageIds : undefined,
        errors: sendResults.errors.length > 0 ? sendResults.errors : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send campaign email error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';
    
    return NextResponse.json(
      {
        error: 'Failed to send campaign emails',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

