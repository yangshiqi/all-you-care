import { NextRequest, NextResponse } from 'next/server';

interface SubscribeRequest {
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Brevo API 端点：创建或更新联系人
 * 文档：https://developers.brevo.com/reference/createcontact
 */
async function subscribeToBrevo(data: SubscribeRequest) {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  // Brevo Contacts API 端点
  const brevoUrl = 'https://api.brevo.com/v3/contacts';
  
  // 构建请求体
  const requestBody: {
    email: string;
    attributes?: Record<string, string>;
    listIds?: number[];
    updateEnabled?: boolean;
  } = {
    email: data.email,
    updateEnabled: true, // 如果联系人已存在，自动更新
  };
  
  // 构建属性对象
  const attributes: Record<string, string> = {};
  
  if (data.firstName) {
    attributes.FIRSTNAME = data.firstName;
  }
  
  if (data.lastName) {
    attributes.LASTNAME = data.lastName;
  }
  
  // 添加订阅来源标识
  attributes.SUBSCRIPTION_SOURCE = 'ainews';
  
  if (Object.keys(attributes).length > 0) {
    requestBody.attributes = attributes;
  }
  
  // 如果配置了列表 ID，添加到列表中
  const listId = process.env.BREVO_LIST_ID;
  if (listId) {
    const listIdNum = parseInt(listId, 10);
    if (!isNaN(listIdNum)) {
      requestBody.listIds = [listIdNum];
    }
  }

  try {
    const response = await fetch(brevoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    // 尝试解析响应为 JSON
    let responseData: { id?: number | string; message?: string };
    const responseText = await response.text();
    
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch {
      // 如果响应不是 JSON，记录原始响应
      console.error('Brevo API 返回了非 JSON 响应:', responseText);
      responseData = { message: responseText || 'Unknown error' };
    }

    if (!response.ok) {
      // Brevo 返回的错误处理
      // 如果联系人已存在（400 或 204），使用 updateEnabled: true 应该会自动更新
      // 但如果仍然返回错误，尝试处理
      if (response.status === 400) {
        const errorMsg = responseData.message || responseText || '';
        // 检查是否是联系人已存在的错误
        if (errorMsg.toLowerCase().includes('already exists') || 
            errorMsg.toLowerCase().includes('duplicate')) {
          return {
            success: true,
            contactId: data.email,
            message: 'Successfully subscribed to Brevo (contact already exists)',
          };
        }
      }
      
      // 204 No Content 表示成功更新
      if (response.status === 204) {
        return {
          success: true,
          contactId: data.email,
          message: 'Successfully updated contact in Brevo',
        };
      }
      
      const errorMessage = responseData.message || responseText || `Brevo API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    return {
      success: true,
      contactId: responseData.id || data.email,
      message: 'Successfully subscribed to Brevo',
    };
  } catch (error) {
    console.error('Brevo subscription error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SubscribeRequest = await request.json();
    
    // 验证必填字段
    if (!body.email || !body.email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 调用 Brevo API
    const result = await subscribeToBrevo({
      email: body.email.trim(),
      firstName: body.firstName?.trim(),
      lastName: body.lastName?.trim(),
    });

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        contactId: result.contactId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Subscribe API error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';
    
    return NextResponse.json(
      {
        error: 'Failed to subscribe',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

