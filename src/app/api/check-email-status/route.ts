import { NextRequest, NextResponse } from 'next/server';

interface CheckEmailStatusRequest {
  messageId?: string;
  email?: string;
  limit?: number;
}

/**
 * 通过 messageId 查询邮件发送状态和事件历史
 * 文档：https://developers.brevo.com/reference/gettransacemailevents
 */
async function getEmailEvents(messageId: string, apiKey: string, limit: number = 50) {
  // 使用正确的 Brevo API 端点
  const eventsUrl = `https://api.brevo.com/v3/smtp/statistics/events`;
  
  // 构建查询参数
  const params = new URLSearchParams({
    messageId: messageId,
    limit: limit.toString(),
    offset: '0',
  });

  try {
    const response = await fetch(`${eventsUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get email events: ${response.status} - ${errorText}`);
    }

    const eventsData = await response.json();
    return eventsData;
  } catch (error) {
    console.error('Error getting email events:', error);
    throw error;
  }
}

/**
 * 通过邮箱地址查询邮件事件
 */
async function getEmailEventsByEmail(email: string, apiKey: string, limit: number = 50) {
  const eventsUrl = `https://api.brevo.com/v3/smtp/statistics/events`;
  
  const params = new URLSearchParams({
    email: email,
    limit: limit.toString(),
    offset: '0',
  });

  try {
    const response = await fetch(`${eventsUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get email events: ${response.status} - ${errorText}`);
    }

    const eventsData = await response.json();
    return eventsData;
  } catch (error) {
    console.error('Error getting email events by email:', error);
    throw error;
  }
}

/**
 * 格式化事件状态，便于理解
 */
function formatEventStatus(event: any) {
  const statusMap: Record<string, string> = {
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

  return {
    event: event.event || 'unknown',
    eventName: statusMap[event.event] || event.event,
    date: event.date || event.date_time,
    reason: event.reason || null,
    tag: event.tag || null,
    link: event.link || null,
    ip: event.ip || null,
    userAgent: event.user_agent || null,
    raw: event,
  };
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'BREVO_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const messageId = searchParams.get('messageId');
    const email = searchParams.get('email');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!messageId && !email) {
      return NextResponse.json(
        { error: 'Either messageId or email parameter is required' },
        { status: 400 }
      );
    }

    let eventsData;
    
    if (messageId) {
      console.log(`Querying email events for messageId: ${messageId}`);
      eventsData = await getEmailEvents(messageId, apiKey, limit);
    } else if (email) {
      console.log(`Querying email events for email: ${email}`);
      eventsData = await getEmailEventsByEmail(email, apiKey, limit);
    }

    // 格式化事件数据
    const events = Array.isArray(eventsData.events) 
      ? eventsData.events.map(formatEventStatus)
      : [];
    
    // 按时间排序（最新的在前）
    events.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    // 提取最新状态
    const latestEvent = events.length > 0 ? events[0] : null;
    const status = latestEvent ? latestEvent.eventName : '未知';

    return NextResponse.json(
      {
        success: true,
        messageId: messageId || null,
        email: email || null,
        status,
        totalEvents: events.length,
        latestEvent: latestEvent ? {
          event: latestEvent.event,
          eventName: latestEvent.eventName,
          date: latestEvent.date,
          reason: latestEvent.reason,
        } : null,
        events,
        summary: {
          delivered: events.filter(e => e.event === 'delivered').length,
          opened: events.filter(e => e.event === 'opened').length,
          clicked: events.filter(e => e.event === 'clicked').length,
          bounced: events.filter(e => e.event === 'bounces' || e.event === 'hardBounces' || e.event === 'softBounces').length,
          complaint: events.filter(e => e.event === 'complaint').length,
          blocked: events.filter(e => e.event === 'blocked').length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Check email status error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';
    
    return NextResponse.json(
      {
        error: 'Failed to check email status',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
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

    const body: CheckEmailStatusRequest = await request.json();
    const { messageId, email, limit = 50 } = body;

    if (!messageId && !email) {
      return NextResponse.json(
        { error: 'Either messageId or email is required' },
        { status: 400 }
      );
    }

    let eventsData;
    
    if (messageId) {
      console.log(`Querying email events for messageId: ${messageId}`);
      eventsData = await getEmailEvents(messageId, apiKey, limit);
    } else if (email) {
      console.log(`Querying email events for email: ${email}`);
      eventsData = await getEmailEventsByEmail(email, apiKey, limit);
    }

    // 格式化事件数据
    const events = Array.isArray(eventsData.events) 
      ? eventsData.events.map(formatEventStatus)
      : [];
    
    // 按时间排序（最新的在前）
    events.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    // 提取最新状态
    const latestEvent = events.length > 0 ? events[0] : null;
    const status = latestEvent ? latestEvent.eventName : '未知';

    return NextResponse.json(
      {
        success: true,
        messageId: messageId || null,
        email: email || null,
        status,
        totalEvents: events.length,
        latestEvent: latestEvent ? {
          event: latestEvent.event,
          eventName: latestEvent.eventName,
          date: latestEvent.date,
          reason: latestEvent.reason,
        } : null,
        events,
        summary: {
          delivered: events.filter(e => e.event === 'delivered').length,
          opened: events.filter(e => e.event === 'opened').length,
          clicked: events.filter(e => e.event === 'clicked').length,
          bounced: events.filter(e => e.event === 'bounces' || e.event === 'hardBounces' || e.event === 'softBounces').length,
          complaint: events.filter(e => e.event === 'complaint').length,
          blocked: events.filter(e => e.event === 'blocked').length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Check email status error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';
    
    return NextResponse.json(
      {
        error: 'Failed to check email status',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

