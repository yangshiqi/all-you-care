# Supabase to Turso Migration Design

## Background

all-you-care 项目当前使用 Supabase 作为数据后端，因出站流量（Egress）超额产生成本压力。Grace period 截止 2026-04-17。需要迁移到免费额度更充裕的方案。

## Decision

迁移到 **Turso**（基于 libSQL/SQLite）。免费额度：9GB 存储、10 亿次行读取/月，远超当前用量。

## Scope

- 应用端：替换 Supabase client 为 Turso client，改写查询
- n8n 端：改为通过 Turso HTTP API 写入数据
- 一次性数据迁移：从 Supabase 导出现有数据到 Turso

## 数据库 Schema

```sql
CREATE TABLE n8n_ai_contents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  tags TEXT,
  created_at TEXT NOT NULL,
  lang TEXT NOT NULL,
  is_published INTEGER DEFAULT 0,
  imgUrl TEXT,
  journal_id TEXT
);

CREATE TABLE n8n_good_contents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  tags TEXT,
  created_at TEXT NOT NULL,
  lang TEXT NOT NULL,
  is_published INTEGER DEFAULT 0,
  imgUrl TEXT,
  journal_id TEXT
);

CREATE INDEX idx_ai_contents_lang_created ON n8n_ai_contents(lang, created_at DESC);
CREATE INDEX idx_ai_contents_journal_id ON n8n_ai_contents(journal_id);
CREATE INDEX idx_good_contents_lang_published ON n8n_good_contents(lang, is_published);
```

与 Supabase 的差异：
- 表名下划线代替连字符（SQLite 限制）
- `boolean` → `INTEGER` (0/1)
- `timestamp` → `TEXT`（ISO 8601 字符串）

## 应用层改动

### 文件变更清单

| 文件 | 改动 |
|------|------|
| `src/lib/supabase.ts` | 删除，新建 `src/lib/turso.ts` |
| `src/lib/api.ts` | 5 个查询函数从 Supabase 链式调用改为 SQL |
| `src/app/api/send-latest-ai-news/route.ts` | 2 个操作改为 SQL |
| `src/app/api/issues/route.ts` | 新增 — 为客户端组件提供数据 API |
| `src/app/api/tags/route.ts` | 新增 — 为客户端组件提供标签 API |
| `src/components/IssuesList.tsx` | 改为 fetch `/api/issues` |
| `src/components/RecentIssues.tsx` | 改为 fetch `/api/issues?recent=true` |
| `src/components/TagsList.tsx` | 改为 fetch `/api/tags` |
| `src/components/TagIssuesList.tsx` | 改为 fetch `/api/issues?tag=xxx` |
| `src/app/test-supabase/page.tsx` | 删除或改为 test-turso |
| `package.json` | `-@supabase/supabase-js` `+@libsql/client` |
| `.env` | 替换环境变量 |

### 不需要改动的部分

- 所有页面组件的 UI/布局
- 路由结构、i18n
- 类型定义（`N8nAiContent`、`IssueSummary`、`TagSummary` 等）
- Server Components 中调用 `api.ts` 的方式（函数签名不变）

### 查询改写示例

```typescript
// Supabase
const { data, count } = await supabase
  .from('n8n-ai-contents')
  .select('id, title, summary, created_at, tags, lang, journal_id', { count: 'exact' })
  .eq('lang', dbLang)
  .order('created_at', { ascending: false })
  .range(from, to);

// Turso
const result = await turso.execute({
  sql: `SELECT id, title, summary, created_at, tags, lang, journal_id
        FROM n8n_ai_contents WHERE lang = ?
        ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  args: [dbLang, pageSize, (page - 1) * pageSize],
});
const countResult = await turso.execute({
  sql: `SELECT COUNT(*) as total FROM n8n_ai_contents WHERE lang = ?`,
  args: [dbLang],
});
```

### 客户端组件架构变化

当前：客户端组件直接调用 `api.ts` → Supabase（public anon key 暴露在浏览器）

迁移后：客户端组件 fetch → Next.js API Route → `api.ts` → Turso（凭据仅在服务端）

安全性提升：数据库凭据不再暴露到客户端。

## 环境变量

```diff
- NEXT_PUBLIC_SUPABASE_URL=https://ylcjjcfopcuwtspiiytl.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
+ TURSO_DATABASE_URL=libsql://your-db-name-your-org.turso.io
+ TURSO_AUTH_TOKEN=xxx
```

Vercel 项目设置中也需同步更新。

## n8n 工作流改动

当前 n8n 通过 Supabase 节点写入数据。迁移后改为 HTTP Request 节点调用 Turso HTTP API：

```
POST https://<db>.turso.io/v2/pipeline
Authorization: Bearer <TURSO_AUTH_TOKEN>
Content-Type: application/json

{
  "requests": [{
    "type": "execute",
    "stmt": {
      "sql": "INSERT INTO n8n_ai_contents (...) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      "args": [{"type": "text", "value": "..."}]
    }
  }]
}
```

## 数据迁移步骤

1. 在 Turso 创建数据库，执行建表 SQL
2. 从 Supabase Dashboard 导出 `n8n-ai-contents` 和 `n8n-good-contents` 为 CSV
3. 编写迁移脚本将 CSV 数据 INSERT 到 Turso（处理 boolean→integer 转换）
4. 验证数据完整性（行数、抽样对比）

## 测试策略

- 本地开发环境连接 Turso 测试所有页面
- 验证分页、语言过滤、标签聚合、期刊详情等核心功能
- 验证邮件发送 API 的读写操作
- Vercel Preview 部署验证
