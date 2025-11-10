# 多频道架构改进计划

**创建日期**: 2025-01-XX  
**状态**: 📋 待确认

## 📋 需求概述

实现多频道支持，通过不同的二级域名（如 `ai.snapallx.com`, `education.snapallx.com`, `snowboard.snapallx.com`）来切换不同的内容、配置和数据源。

## 🎯 核心目标

1. **频道识别**: 根据二级域名自动识别当前频道
2. **内容隔离**: 每个频道有独立的内容数据源（Supabase）
3. **邮件隔离**: 每个频道有独立的 Brevo Campaign 和联系人列表
4. **配置隔离**: 每个频道有独立的配置（如发件人信息、表单配置等）
5. **SEO优化**: 每个频道有独立的 SEO 元数据

## 🏗️ 架构设计

### 1. 频道配置系统

#### 1.1 频道配置结构

创建统一的频道配置管理，支持以下配置项：

```typescript
interface ChannelConfig {
  // 基础信息
  id: string;                    // 频道唯一标识 (如: 'ai', 'education', 'snowboard')
  name: string;                  // 频道显示名称
  subdomain: string;             // 二级域名 (如: 'ai', 'education')
  domain: string;                // 完整域名 (如: 'ai.snapallx.com')
  
  // Supabase 配置
  supabase: {
    tableName: string;           // 数据表名 (如: 'n8n-ai-contents', 'n8n-education-contents')
    langField?: string;           // 语言字段名 (默认: 'lang')
    defaultLang?: string;         // 默认语言 (如: 'zh_CN')
    filterField?: string;        // 频道过滤字段 (如: 'channel', 'category')
    filterValue?: string;         // 频道过滤值 (如: 'ai', 'education')
  };
  
  // Brevo 配置
  brevo: {
    campaignId: number;          // Campaign ID
    listId?: number;             // 联系人列表 ID (可选)
    formActionUrl?: string;      // Brevo 表单 Action URL
    senderEmail?: string;        // 发件人邮箱
    senderName?: string;         // 发件人名称
  };
  
  // SEO 配置
  seo: {
    title: string;               // 页面标题模板
    description: string;         // 页面描述
    keywords?: string[];         // SEO 关键词
    ogImage?: string;            // Open Graph 图片
  };
  
  // UI 配置
  ui: {
    theme?: string;              // 主题标识 (可选，用于未来扩展)
    logo?: string;               // Logo URL (可选)
    brandColor?: string;         // 品牌主色 (可选)
  };
}
```

#### 1.2 配置存储方案

**方案 A: 环境变量配置（推荐用于少量频道）**
- 优点: 简单、快速实现、无需数据库
- 缺点: 频道数量受限、需要重新部署才能添加频道
- 适用: 频道数量 < 10

**方案 B: 数据库配置表（推荐用于多频道）**
- 优点: 动态添加频道、无需重新部署、易于管理
- 缺点: 需要额外的数据库表、需要管理界面
- 适用: 频道数量 >= 10

**方案 C: 配置文件 + 环境变量（混合方案）**
- 优点: 平衡灵活性和简单性
- 缺点: 需要维护配置文件
- 适用: 中等数量频道（5-20）

**推荐**: 先使用**方案 A（环境变量）**快速实现，后续可迁移到**方案 B（数据库）**。

### 2. 频道识别中间件

#### 2.1 中间件改造

修改 `src/middleware.ts`，实现频道识别和配置注入：

```typescript
// 功能：
// 1. 从请求头提取 hostname
// 2. 解析二级域名
// 3. 匹配频道配置
// 4. 将频道信息注入到请求头或 cookie
// 5. 处理无效域名的重定向
```

#### 2.2 频道识别逻辑

```typescript
// 支持的域名格式：
// - ai.snapallx.com → channel: 'ai'
// - education.snapallx.com → channel: 'education'
// - snowboard.snapallx.com → channel: 'snowboard'
// - localhost:3000 → channel: 'default' (开发环境)
```

### 3. 数据层改造

#### 3.1 Supabase 查询改造

**当前问题**:
- `src/lib/api.ts` 中的函数硬编码了表名 `'n8n-ai-contents'`
- 没有频道过滤逻辑

**改造方案**:
1. 创建频道感知的数据访问层
2. 所有数据查询函数接收 `channel` 参数
3. 根据频道配置动态选择表名和过滤条件

**改造文件**:
- `src/lib/api.ts` - 所有数据查询函数
- `src/lib/supabase.ts` - Supabase 客户端初始化（如需要）

#### 3.2 数据表结构建议

**方案 A: 独立表（推荐）**
- 每个频道使用独立的数据表
- 例如: `n8n-ai-contents`, `n8n-education-contents`, `n8n-snowboard-contents`
- 优点: 数据完全隔离、查询简单、性能好
- 缺点: 表结构需要保持一致

**方案 B: 统一表 + 频道字段**
- 所有频道共享一个表，使用 `channel` 字段区分
- 例如: `n8n-contents` 表，包含 `channel` 字段
- 优点: 统一管理、易于跨频道查询
- 缺点: 需要添加索引、查询需要过滤

**推荐**: 使用**方案 A（独立表）**，因为：
1. 数据隔离更清晰
2. 未来可以针对不同频道优化表结构
3. 查询性能更好

### 4. Brevo 集成改造

#### 4.1 订阅 API 改造

**当前问题**:
- `src/app/api/subscribe/route.ts` 硬编码了 `SUBSCRIPTION_SOURCE = 'ainews'`
- 硬编码了 `BREVO_LIST_ID` 环境变量

**改造方案**:
1. 从请求中获取频道信息（通过中间件注入）
2. 根据频道配置选择对应的 Brevo List ID
3. 设置频道相关的订阅来源标识

#### 4.2 邮件发送 API 改造

**当前问题**:
- `src/app/api/send-latest-ai-news/route.ts` 硬编码了 `campaignId = 6`
- 硬编码了 `lang = 'zh_CN'` 过滤
- `src/app/api/send-campaign-email/route.ts` 硬编码了 `campaignId = 6`

**改造方案**:
1. 支持通过查询参数或请求头传递频道信息
2. 根据频道配置选择对应的 Campaign ID
3. 根据频道配置选择对应的 Supabase 表和过滤条件

#### 4.3 Brevo 表单改造

**当前问题**:
- `src/components/Hero.tsx` 中硬编码了 Brevo 表单的 Action URL

**改造方案**:
1. 根据频道配置动态设置表单 Action URL
2. 在表单中添加频道标识字段（如果需要）

### 5. UI 组件改造

#### 5.1 页面元数据改造

**改造文件**:
- `src/app/page.tsx` - 首页元数据
- `src/app/issues/page.tsx` - 期刊列表页元数据
- `src/app/issues/[slug]/page.tsx` - 期刊详情页元数据
- `src/app/tags/page.tsx` - 标签列表页元数据
- `src/app/tags/[tag]/page.tsx` - 标签页元数据

**改造内容**:
- 根据频道配置动态生成 SEO 元数据
- 标题、描述、关键词等根据频道定制

#### 5.2 Header 组件改造

**改造文件**:
- `src/components/Header.tsx`

**改造内容**:
- 根据频道显示不同的 Logo（如果有）
- 根据频道显示不同的品牌名称

#### 5.3 Hero 组件改造

**改造文件**:
- `src/components/Hero.tsx`

**改造内容**:
- 根据频道配置动态设置 Brevo 表单 Action URL
- 根据频道显示不同的标题和描述（通过 i18n）

### 6. 国际化改造

#### 6.1 多频道 i18n 支持

**当前问题**:
- `src/lib/i18n.ts` 和翻译文件没有频道区分

**改造方案**:
1. 翻译键可以包含频道前缀（可选）
2. 或者为每个频道创建独立的翻译命名空间
3. 或者使用通用的翻译键，通过频道配置覆盖特定值

**推荐**: 使用通用翻译键 + 频道配置覆盖，因为：
- 大部分内容可以共享
- 只需要覆盖频道特定的内容

### 7. Cron Jobs 改造

#### 7.1 Vercel Cron 配置改造

**当前问题**:
- `vercel.json` 中硬编码了 `campaignId=6`

**改造方案**:
1. 为每个频道创建独立的 Cron Job
2. 每个 Cron Job 调用对应的频道 API

**示例**:
```json
{
  "crons": [
    {
      "path": "/api/send-latest-ai-news?channel=ai",
      "schedule": "30 8 * * *"
    },
    {
      "path": "/api/send-latest-ai-news?channel=education",
      "schedule": "30 8 * * *"
    },
    {
      "path": "/api/send-latest-ai-news?channel=snowboard",
      "schedule": "30 8 * * *"
    }
  ]
}
```

### 8. 环境变量设计

#### 8.1 频道配置环境变量

**方案 A: JSON 格式（推荐）**
```bash
CHANNELS_CONFIG='{
  "ai": {
    "name": "AI News",
    "subdomain": "ai",
    "supabase": {
      "tableName": "n8n-ai-contents"
    },
    "brevo": {
      "campaignId": 6,
      "listId": 1,
      "formActionUrl": "https://...",
      "senderEmail": "ai@snapallx.com",
      "senderName": "[AI]News"
    }
  },
  "education": {
    "name": "Education News",
    "subdomain": "education",
    "supabase": {
      "tableName": "n8n-education-contents"
    },
    "brevo": {
      "campaignId": 7,
      "listId": 2,
      "formActionUrl": "https://...",
      "senderEmail": "education@snapallx.com",
      "senderName": "[Education]News"
    }
  }
}'
```

**方案 B: 前缀格式**
```bash
# AI 频道
CHANNEL_AI_NAME="AI News"
CHANNEL_AI_SUBDOMAIN="ai"
CHANNEL_AI_SUPABASE_TABLE="n8n-ai-contents"
CHANNEL_AI_BREVO_CAMPAIGN_ID=6
CHANNEL_AI_BREVO_LIST_ID=1
CHANNEL_AI_BREVO_FORM_ACTION_URL="https://..."

# Education 频道
CHANNEL_EDUCATION_NAME="Education News"
CHANNEL_EDUCATION_SUBDOMAIN="education"
CHANNEL_EDUCATION_SUPABASE_TABLE="n8n-education-contents"
CHANNEL_EDUCATION_BREVO_CAMPAIGN_ID=7
CHANNEL_EDUCATION_BREVO_LIST_ID=2
CHANNEL_EDUCATION_BREVO_FORM_ACTION_URL="https://..."
```

**推荐**: 使用**方案 A（JSON 格式）**，因为：
- 配置更集中、易于管理
- 结构更清晰
- 易于扩展

#### 8.2 默认频道配置

```bash
# 默认频道（用于 localhost 开发环境）
DEFAULT_CHANNEL="ai"

# 支持的频道列表（用于验证）
SUPPORTED_CHANNELS="ai,education,snowboard"
```

## 📝 实施步骤

### 阶段 1: 基础架构搭建（优先级：高）

1. **创建频道配置系统**
   - [ ] 创建 `src/lib/channels.ts` - 频道配置管理
   - [ ] 定义 `ChannelConfig` 接口
   - [ ] 实现频道配置加载函数
   - [ ] 实现频道识别函数

2. **改造中间件**
   - [ ] 修改 `src/middleware.ts` 实现频道识别
   - [ ] 将频道信息注入到请求头
   - [ ] 处理无效域名的重定向

3. **创建频道上下文**
   - [ ] 创建 `src/lib/channel-context.ts` - 服务端频道上下文
   - [ ] 创建 `src/components/ChannelProvider.tsx` - 客户端频道提供者（如需要）

### 阶段 2: 数据层改造（优先级：高）

4. **改造 Supabase 数据访问层**
   - [ ] 修改 `src/lib/api.ts` 所有函数支持频道参数
   - [ ] 实现频道感知的数据查询逻辑
   - [ ] 更新所有调用数据函数的地方传递频道信息

5. **更新页面组件**
   - [ ] 修改 `src/app/page.tsx` 使用频道配置
   - [ ] 修改 `src/app/issues/page.tsx` 使用频道配置
   - [ ] 修改 `src/app/issues/[slug]/page.tsx` 使用频道配置
   - [ ] 修改 `src/app/tags/page.tsx` 使用频道配置
   - [ ] 修改 `src/app/tags/[tag]/page.tsx` 使用频道配置

### 阶段 3: Brevo 集成改造（优先级：高）

6. **改造订阅 API**
   - [ ] 修改 `src/app/api/subscribe/route.ts` 支持频道
   - [ ] 根据频道选择对应的 Brevo List ID
   - [ ] 设置频道相关的订阅来源标识

7. **改造邮件发送 API**
   - [ ] 修改 `src/app/api/send-latest-ai-news/route.ts` 支持频道
   - [ ] 修改 `src/app/api/send-campaign-email/route.ts` 支持频道
   - [ ] 根据频道选择对应的 Campaign ID 和 Supabase 表

8. **改造 Brevo 表单**
   - [ ] 修改 `src/components/Hero.tsx` 动态设置表单 Action URL
   - [ ] 根据频道配置加载表单配置

### 阶段 4: UI 和 SEO 改造（优先级：中）

9. **更新页面元数据**
   - [ ] 所有页面根据频道生成 SEO 元数据
   - [ ] 更新 sitemap 生成逻辑支持多频道

10. **更新 UI 组件**
    - [ ] 修改 `src/components/Header.tsx` 支持频道 Logo
    - [ ] 修改 `src/components/Hero.tsx` 支持频道特定内容

### 阶段 5: Cron Jobs 和部署（优先级：中）

11. **更新 Cron 配置**
    - [ ] 修改 `vercel.json` 为每个频道创建独立的 Cron Job
    - [ ] 测试每个频道的 Cron Job

12. **环境变量配置**
    - [ ] 在 Vercel 中配置所有频道的环境变量
    - [ ] 创建环境变量配置文档

### 阶段 6: 测试和文档（优先级：中）

13. **测试**
    - [ ] 单元测试频道识别逻辑
    - [ ] 集成测试数据查询
    - [ ] 端到端测试订阅流程
    - [ ] 测试邮件发送功能

14. **文档更新**
    - [ ] 更新 `allaboutproject.md` 添加多频道架构说明
    - [ ] 创建频道配置指南
    - [ ] 更新 `changelog.md`

## 🔍 技术细节

### 频道识别实现

```typescript
// src/lib/channels.ts
export function getChannelFromHostname(hostname: string): string {
  // 解析二级域名
  // ai.snapallx.com -> 'ai'
  // education.snapallx.com -> 'education'
  // localhost:3000 -> 'default' (开发环境)
  
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    const subdomain = parts[0];
    // 验证是否是有效的频道
    if (isValidChannel(subdomain)) {
      return subdomain;
    }
  }
  
  // 开发环境或无效域名，返回默认频道
  return process.env.DEFAULT_CHANNEL || 'ai';
}
```

### 频道配置加载

```typescript
// src/lib/channels.ts
export function getChannelConfig(channelId: string): ChannelConfig {
  // 从环境变量加载配置
  const configJson = process.env.CHANNELS_CONFIG;
  const configs = JSON.parse(configJson || '{}');
  
  const config = configs[channelId];
  if (!config) {
    throw new Error(`Channel config not found: ${channelId}`);
  }
  
  return {
    id: channelId,
    ...config,
  };
}
```

### 数据查询改造示例

```typescript
// src/lib/api.ts
export async function getAllAiContents(
  channelId: string,
  i18nLang?: string
): Promise<N8nAiContent[]> {
  const channelConfig = getChannelConfig(channelId);
  const tableName = channelConfig.supabase.tableName;
  
  let query = supabase
    .from(tableName)  // 使用频道配置的表名
    .select('*')
    .order('created_at', { ascending: false });
  
  // 如果有频道过滤字段，添加过滤条件
  if (channelConfig.supabase.filterField && channelConfig.supabase.filterValue) {
    query = query.eq(
      channelConfig.supabase.filterField,
      channelConfig.supabase.filterValue
    );
  }
  
  // 语言过滤
  const dbLang = mapI18nLangToDbLang(i18nLang, channelConfig);
  if (dbLang) {
    query = query.eq(channelConfig.supabase.langField || 'lang', dbLang);
  }
  
  const { data, error } = await query;
  // ... 错误处理
  return data || [];
}
```

## ⚠️ 注意事项

1. **向后兼容性**
   - 确保现有功能不受影响
   - 默认频道应该与当前行为一致

2. **性能考虑**
   - 频道配置应该缓存，避免每次请求都解析 JSON
   - 数据查询应该使用索引

3. **安全性**
   - 验证频道 ID 的有效性
   - 防止频道配置注入攻击

4. **错误处理**
   - 无效域名的处理
   - 缺失频道配置的处理
   - 数据查询失败的处理

5. **开发环境**
   - 支持 localhost 开发
   - 支持通过查询参数覆盖频道（如 `?channel=education`）

## 📊 预期影响

### 代码变更
- **新增文件**: 2-3 个（频道配置管理、频道上下文）
- **修改文件**: 15-20 个（数据层、API、组件、页面）
- **代码行数**: 预计增加 500-800 行

### 配置变更
- **环境变量**: 新增 1 个主要配置（`CHANNELS_CONFIG`）
- **Vercel 配置**: 更新 Cron Jobs 配置

### 数据库变更
- **Supabase**: 可能需要创建新的数据表（如果使用独立表方案）
- **Brevo**: 需要为每个频道创建 Campaign 和 List

## ✅ 验收标准

1. ✅ 每个频道可以独立访问，显示独立的内容
2. ✅ 每个频道的订阅功能正常工作，联系人添加到对应的 Brevo List
3. ✅ 每个频道的邮件发送功能正常工作，使用对应的 Campaign
4. ✅ 每个频道的 SEO 元数据正确
5. ✅ 开发环境可以正常开发和测试
6. ✅ 所有现有功能不受影响（向后兼容）

## 🚀 后续优化

1. **频道管理界面**: 创建管理后台动态管理频道配置
2. **频道分析**: 为每个频道添加独立的分析统计
3. **频道切换**: 允许用户在频道间切换（如果需要）
4. **内容同步**: 实现跨频道内容同步功能（如果需要）

---

**下一步**: 等待确认后开始实施阶段 1


