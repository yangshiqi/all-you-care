import { NextRequest, NextResponse } from 'next/server';

interface SubscribeRequest {
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * HubSpot API 端点：创建或更新联系人
 * 文档：https://developers.hubspot.com/docs/api/crm/contacts
 */
async function subscribeToHubSpot(data: SubscribeRequest) {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error('HUBSPOT_ACCESS_TOKEN is not configured');
  }

  // HubSpot Contacts API 端点
  const hubspotUrl = 'https://api.hubapi.com/crm/v3/objects/contacts';
  
  // 构建请求体
  const properties: Record<string, string> = {
    email: data.email,
    subscription_type: 'ainews', // 标识从 AINews 表单提交的用户
  };
  
  if (data.firstName) {
    properties.firstname = data.firstName;
  }
  
  if (data.lastName) {
    properties.lastname = data.lastName;
  }

  const requestBody = {
    properties,
  };

  try {
    const response = await fetch(hubspotUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      // HubSpot 返回的错误处理
      // 如果联系人已存在（409），也算是成功
      if (response.status === 409) {
        // 联系人已存在，尝试更新
        return await updateHubSpotContact(data, accessToken);
      }
      
      const errorMessage = responseData.message || `HubSpot API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    return {
      success: true,
      contactId: responseData.id,
      message: 'Successfully subscribed to HubSpot',
    };
  } catch (error) {
    console.error('HubSpot subscription error:', error);
    throw error;
  }
}

/**
 * 更新现有 HubSpot 联系人
 */
async function updateHubSpotContact(
  data: SubscribeRequest,
  accessToken: string
) {
  // 首先通过邮箱查找联系人
  const searchUrl = 'https://api.hubapi.com/crm/v3/objects/contacts/search';
  
  const searchBody = {
    filterGroups: [
      {
        filters: [
          {
            propertyName: 'email',
            operator: 'EQ',
            value: data.email,
          },
        ],
      },
    ],
    properties: ['email', 'firstname', 'lastname', 'subscription_type'],
    limit: 1,
  };

  try {
    // 搜索联系人
    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(searchBody),
    });

    if (!searchResponse.ok) {
      throw new Error('Failed to search for existing contact');
    }

    const searchData = await searchResponse.json();
    
    if (searchData.results && searchData.results.length > 0) {
      const contactId = searchData.results[0].id;
      
      // 更新联系人
      const updateUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`;
      
      const properties: Record<string, string> = {
        subscription_type: 'ainews', // 更新订阅类型标识
      };
      
      if (data.firstName) {
        properties.firstname = data.firstName;
      }
      
      if (data.lastName) {
        properties.lastname = data.lastName;
      }

      const updateBody = {
        properties,
      };

      const updateResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updateBody),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update existing contact');
      }

      return {
        success: true,
        contactId,
        message: 'Successfully updated existing contact in HubSpot',
      };
    } else {
      throw new Error('Contact not found for update');
    }
  } catch (error) {
    console.error('HubSpot update error:', error);
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

    // 调用 HubSpot API
    const result = await subscribeToHubSpot({
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

