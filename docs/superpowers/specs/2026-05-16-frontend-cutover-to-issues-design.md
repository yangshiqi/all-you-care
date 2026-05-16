# 前端切表到 pipeline issues 表 设计

**Date:** 2026-05-16
**Status:** Design approved, pending implementation plan
**Repo target:** `all-you-care/`
**Replaces:** PR 4 of [n8n → TypeScript Pipeline 重写设计](./2026-05-13-n8n-to-pipeline-design.md)
**Branch:** `pipeline-rewrite`

---

## 1. 背景

n8n → pipeline 重写已经完成 PR 1-3：

- 新 `issues` 表 schema + RPC + 10 行历史导入（PR 1）
- 完整 pipeline 6 步 + 辅助步 + 全部 GitHub Actions cron（PR 2-3）
- pipeline 已经在并跑：新数据进 `issues`，老 n8n 仍写 `n8n-ai-contents`

现在做 PR 4：**前端 `src/lib/api.ts` 和邮件发送 API route 全部切到读 `issues` 表**，让网站完全依赖 pipeline 的产出。

## 2. 目标与非目标

### 目标

- 前端所有数据读取（首页 / issues 列表 / issue 详情 / tags / sitemap）从 `n8n-ai-contents` 切到 `issues`，加 `channel = 'ai'` 过滤。
- `/api/send-latest-ai-news`（mailer）改读 `issues`，删掉自带的 `is_published` 双轨。
- `getAllTags` 改读 pipeline 维护的 `tag_counts` 表。
- 保持前端组件 / 类型 / 函数签名稳定（contract stable），改动尽量收敛在 api.ts + supabase.ts + mailer。
- 老 `n8n-ai-contents` / `n8n-good-contents` 表保留只读（spec PR 5 才清理）。

### 非目标

- 不动 `snapai_insights`（blog 表，独立）。
- 不动 `subscribe` / `check-email-status` / `send-campaign-email` 三个 API route（与 issues 表无关）。
- 不重命名前端类型 `N8nAiContent` / 函数 `getAiContentByJournalId` 等（避免触动所有 consumer）。
- 不展示 SNOW 频道 issue（站点定位是 AI 新闻；mailer 仅做 snow 通路保留）。
- 不导更多历史数据（只用 `issues` 表已有的 10 条）。
- 不删 `src/app/test-supabase/page.tsx`（debug 页面，切表即可）。

## 3. 架构

```
[网站访问]        →  src/lib/api.ts  ──→  issues 表 (channel='ai')
                                     ──→  tag_counts 表 (channel='ai')

[/admin/issues]   →  /api/admin/deliver
                       │ 1. claim issues 行 (set delivering_at)
                       ▼
                     /api/send-latest-ai-news?type=ai&issue_id=N
                       │ 2. 只读 issues 拿到 title/content_html，发邮件
                       │    不写库（不再维护 is_published）
                       ▼
                     回 /api/admin/deliver
                       │ 3. set delivered=true, delivered_at=now()
```

`pipeline deliver` step 沿用同一调用链：claim → fetch mailer URL → set delivered。

## 4. 字段映射

| `n8n-ai-contents` (老) | `issues` (新) | 前端 contract (`N8nAiContent`) |
|---|---|---|
| `id` (uuid string) | `id` (bigint) | `id: string` (api 层 `String(id)`) |
| `title` | `title` | `title: string` |
| `summary` | `summary` | `summary: string` |
| `content` (HTML string) | `content_html` (HTML string) | `content: string` (api 层 alias) |
| `tags` (JSON-string 或 array) | `tags` (text[]) | `tags: string \| string[] \| null` (api 层直接透传 array，consumer 用 `extractTagsFromContent` 容错) |
| `created_at` | `created_at` (排序用 `published_at`) | `created_at: string` (用 `published_at` 填) |
| `lang` ('zh_CN' / 'en') | `lang` (enum 同值) | 不变 |
| `imgUrl` | `cover_image` | `imgUrl: string \| null` (api 层 alias) |
| `journal_id` (string) | `journal_id` (bigint) | `journal_id: string` (api 层 `String(journal_id)`) |
| 无 | `channel` (enum) | 不暴露（始终 'ai'） |
| `is_published` | (删除字段) | 不暴露（mailer 用 `delivered`） |

**关键不变量：** api.ts 内做"DB 行 → `N8nAiContent` shape"的统一映射函数。consumer 代码不需要改。

### Tags 处理

- 老路径：`tags` 是 JSON 字符串（如 `'["ai","gpt"]'`），consumer 用 `extractTagsFromContent` 解析。
- 新路径：`tags` 已是 `text[]`，api 层**直接透传 array**。`extractTagsFromContent` 已经有 `Array.isArray` 分支，自然走通。
- `N8nAiContent.tags` 类型放宽为 `string | string[] | null`，反映两种来源都可能（虽然切表后只会是 array，但向后兼容更稳）。**保留 `extractTagsFromContent`** 作为防御性兜底。

### `getAllTags` 走 `tag_counts`

pipeline 已经在 `tag_counts (channel, lang, name, total)` 里维护聚合。`getAllTags(lang)` 改成：

```ts
let q = supabase.from('tag_counts').select('name, total').eq('channel', 'ai')
if (dbLang) q = q.eq('lang', dbLang)
const { data } = await q.order('total', { ascending: false })
return data.map(r => ({ name: r.name, total: Number(r.total) }))
```

比起从 issues 全表聚合更快、更省。

## 5. 改动清单

### A. `src/lib/supabase.ts`

- 保留 `N8nAiContent` 接口（前端稳定 contract，注释标"DB 后端已切 issues"）。
- 新增内部 `IssueRow` 接口（仅 api.ts 内部使用）：

```ts
interface IssueRow {
  id: number
  channel: 'ai' | 'snow'
  lang: 'zh_CN' | 'en'
  title: string
  summary: string | null
  content_html: string
  tags: string[]
  cover_image: string | null
  journal_id: number | null
  published_at: string
  created_at: string
  delivered: boolean
}
```

### B. `src/lib/api.ts` — 核心改动

- 所有 `.from('n8n-ai-contents')` → `.from('issues')`，加 `.eq('channel', 'ai')`。
- 排序键 `created_at` → `published_at`。
- 新增 `mapIssueRow(row: IssueRow): N8nAiContent` 映射函数。所有 fetcher 复用。
- `journal_id` 是 bigint：但 `getAiContentByJournalId(journalId, lang)` 入参是 string，先 `Number(journalId)` 再查（保留 `Number.isFinite` 校验，非法值直接返 null）。
- `getAllAiContentIds` 返回的 id/journal_id 都 `String(...)`，与 `generateStaticParams` 一致。
- `getAllTags` 改读 `tag_counts`（见 §4）。
- `getIssueMonths` / `getIssuesByMonth`：排序键 / 时间范围切到 `published_at`。
- `mapI18nLangToDbLang` 不变（值都是 'zh_CN' / 'en'）。

### C. `src/app/api/send-latest-ai-news/route.ts` (mailer)

- `MODES` 配置：`tableName` 字段删除，加 `channel`（'ai' / 'snow'）。
- `getLatestZhCNContent(channel)`：读 `issues where channel=$channel AND lang='zh_CN' AND delivered=false ORDER BY published_at desc LIMIT 1`。
- 新增可选 `?issue_id=N` 参数：若给定，直接读 `issues where id=N`（跳过"最新未发"逻辑）。
- 删除 `updateIsPublished`（mailer 不再写库；状态由 admin/deliver 维护）。
- 邮件 body 用 `content_html`，subject 用 `title`。
- 错误信息里的"表名"提示去掉，换成 channel。

### D. `src/app/api/admin/deliver/route.ts`

- 调用 mailer 时把 `&issue_id=${issue.id}` 拼进 URL：

```ts
const deliverUrl = `${DELIVER_URLS[issue.channel]}&issue_id=${issue.id}`
```

这样避免 mailer 重新选行选错。

### E. `src/app/test-supabase/page.tsx`

- 简单切表：`from('n8n-ai-contents')` → `from('issues').eq('channel','ai')`。仅用于调试，不深加工。

### F. 不动的文件

| 文件 | 原因 |
|---|---|
| `src/components/IssueDetailContent.tsx` 等 | 消费 `N8nAiContent` / `IssueSummary`，contract 保持 |
| `src/app/[lang]/issues/[slug]/page.tsx` | 用 `issue.content` / `issue.imgUrl`，api 层映射后透明 |
| `src/app/sitemap.ts` | 通过 `getAllAiContentIds` / `getIssueMonths` 间接 |
| `src/app/[lang]/tags/[tag]/page.tsx` 等 | 通过 `getAllTags` / 详情 api 间接 |
| `src/app/api/subscribe/`、`check-email-status/`、`send-campaign-email/` | 与 issues 表无关 |

## 6. 数据流

### 网站访问
```
GET /[lang]/issues/[slug]
  → getAiContentByJournalId(slug, lang)
    → supabase.from('issues').eq('channel','ai').eq('journal_id', Number(slug)).eq('lang', dbLang).single()
    → mapIssueRow(row) → N8nAiContent
  → IssueDetailContent 渲染 issue.content (= row.content_html)
```

### 发邮件
```
admin 点 "发送" → POST /api/admin/deliver { issue_id }
  → CLAIM issues row (set delivering_at)
  → GET /api/send-latest-ai-news?type=ai&issue_id=N
    → SELECT issues where id=N → 拿 title / content_html
    → Brevo send (campaignId / recipients 不变)
    → 返回 success/fail
  → 成功：UPDATE issues SET delivered=true, delivered_at=now()
  → 失败：UPDATE issues SET delivering_at=null, delivery_attempt_count++
```

## 7. 错误处理

- mailer 收到 `issue_id` 但找不到行 → 返 404，admin/deliver 把 `delivering_at` 清掉。
- mailer 不传 `issue_id` 且找不到未发的 issue → 返 404（与现状一致：原来是"找不到 is_published=false 的"）。
- `getAiContentByJournalId(slug)` 收到非数字 slug → `Number.isFinite` 失败 → 返 null → 路由 404。
- `tag_counts` 查询失败 → 抛错（与现状 `getAllTags` 一致；UI 已经有错误兜底）。
- `journal_id` 在 `issues` 里 NULL 的行 → 详情查不到 → 404。导入脚本会回填 `journal_id = id`，所以 10 行历史应全有值。

## 8. 测试策略

### 手测（无单测，前端代码无测试基建）

本地 dev server `npm run dev`（端口 1717）跑通：

- [ ] `/` 首页：RecentIssues 显示 zh_CN issues
- [ ] `/zh-CN/issues`：分页列表
- [ ] `/zh-CN/issues/[journal_id]`：详情页（title / content / imgUrl / tags 都正确）
- [ ] `/en-US/issues/[journal_id]`：英文版（用同一 journal_id）
- [ ] `/zh-CN/tags`：tag 列表显示
- [ ] `/zh-CN/tags/[tag]`：tag 下 issues 列表
- [ ] `/sitemap.xml`：URL 列表非空
- [ ] `/admin/issues`：列表 + dry-run（`DELIVER_LIVE != 1`）的"发送"按钮走通
- [ ] `/api/test-supabase`：debug 页能查到数据

### 静态检查

- `npm run lint`：无 error
- `npm run build`：production build 成功

### Mailer 不真发邮件验证

`DELIVER_LIVE=1` 仅在生产 Vercel 上启用。本地 dev 默认不会真发邮件（admin/deliver 走 dry-safety）。dry-safety 会直接标 delivered=true，所以本地验证只能确认调用链通，不能确认邮件内容。**生产灰度方案**：合并后人工触发一次 `/admin/issues` 发送，确认收到的邮件 title/正文与 issues 表一致。

## 9. 回滚

- 改动全在 `src/lib/api.ts` / `src/lib/supabase.ts` / `src/app/api/send-latest-ai-news/route.ts` / `src/app/api/admin/deliver/route.ts` / `src/app/test-supabase/page.tsx` 五个文件。
- 老 `n8n-ai-contents` 表完好。`revert` 这次 PR 即可全部回到老路径。
- 回滚成本：单 PR revert + 重新部署。pipeline 仍可继续往新表写（无副作用）。

## 10. 风险与开放问题

1. **`issues` 只有 10 行历史**：切换瞬间老 URL（n8n-ai-contents 时代的）大部分 404。用户已确认接受。后续若有需求可再单独跑导入脚本扩容。
2. **mailer 不再写库**：依赖 admin/deliver / pipeline deliver 路径正确维护 `delivered`。两条链都已经在做这件事，切换后行为一致。
3. **`issue_id` 参数注入**：mailer 是 GET，`issue_id` 通过查询参数传。`Number.isFinite` + Supabase 参数化查询防止注入。
4. **id 数字 → 字符串 contract 跨越**：前端类型 `N8nAiContent.id: string`，DB 是 bigint。`generateStaticParams` 返 string、URL 是 string，api 层负责 `String(...)` 和 `Number(...)` 双向转换。任何一处忘转都会出 bug，集中在 `mapIssueRow` + `getAiContentByJournalId` 入口处理。
5. **`tag_counts` 由 pipeline cron 异步更新**：与 issues 新增有滞后（10-30 分钟级）。可接受——本来 tags 就是聚合统计。
6. **SNOW mailer 留半通路**：mailer 仍支持 `?type=snow`，读 `issues channel='snow'`。但站点不展示 SNOW issue，admin/deliver 也只对 channel='ai' 的有 UI。SNOW 通路靠 pipeline deliver step + workflow_dispatch 走，前端无 UI。这与 spec 一致（admin UI 不强求支持 SNOW）。
7. **`delivered_at` / `published_at` 顺序**：导入脚本里 10 行 `published_at = created_at = CSV.created_at`。前端按 `published_at desc` 排序，结果与老路径按 `created_at desc` 排序一致。
