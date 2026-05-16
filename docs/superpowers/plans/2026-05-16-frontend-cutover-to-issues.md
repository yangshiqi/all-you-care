# Frontend Cutover to `issues` Table — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch the website's data layer (`src/lib/api.ts`) and mailer route (`/api/send-latest-ai-news`) from the legacy `n8n-ai-contents` table to the new pipeline `issues` table (filtered by `channel='ai'`), while keeping the `N8nAiContent` frontend contract stable so consumer components don't change.

**Architecture:** All Supabase reads in `src/lib/api.ts` change `from('n8n-ai-contents')` → `from('issues').eq('channel', 'ai')`. A new internal `mapIssueRow` function converts DB rows to the existing `N8nAiContent` shape (field renames: `content_html`→`content`, `cover_image`→`imgUrl`; `id`/`journal_id` bigint→string). `getAllTags` switches to the pipeline-maintained `tag_counts` table. The mailer route reads from `issues` and stops writing `is_published`; admin/deliver now passes `issue_id` to the mailer to lock the selection.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Supabase JS, no frontend test framework — verification is `npm run lint` + `npm run build` + local dev smoke (`npm run dev` on port 1717).

**Reference spec:** `docs/superpowers/specs/2026-05-16-frontend-cutover-to-issues-design.md`

---

## File Inventory

| Path | Action | What changes |
|---|---|---|
| `src/lib/supabase.ts` | Modify | Add internal `IssueRow` type; loosen `N8nAiContent.tags` to `string \| string[] \| null` |
| `src/lib/api.ts` | Modify | Rewrite all 8 fetchers; add `mapIssueRow` helper; `getAllTags` switches to `tag_counts` |
| `src/app/api/send-latest-ai-news/route.ts` | Modify | `MODES` config (channel not tableName); read `issues`; drop `is_published` writes; accept `?issue_id=N` |
| `src/app/api/admin/deliver/route.ts` | Modify | Append `&issue_id=${issue.id}` to mailer URL |
| `src/app/test-supabase/page.tsx` | No change | Imports `getIssueSummaries` / `getAllAiContents` only — migrates transparently |

**Untouched (verified):** `src/components/*`, `src/app/[lang]/issues/*/page.tsx`, `src/app/sitemap.ts`, `src/app/[lang]/tags/*/page.tsx`, `src/app/api/subscribe/`, `src/app/api/check-email-status/`, `src/app/api/send-campaign-email/`, `src/lib/i18n*.ts`.

---

## Task 1: Loosen types in `src/lib/supabase.ts`

**Files:**
- Modify: `src/lib/supabase.ts`

- [ ] **Step 1: Read current state of supabase.ts**

Read `src/lib/supabase.ts` to confirm the `N8nAiContent` interface shape before editing.

- [ ] **Step 2: Update the interface**

Replace the `N8nAiContent` interface block with:

```ts
// NOTE: DB backend has moved to the `issues` table (channel='ai'). This interface
// remains the stable frontend contract — src/lib/api.ts maps issue rows to this shape.
export interface N8nAiContent {
  id: string
  title: string
  content: string
  summary: string
  tags: string | string[] | null
  created_at: string
  lang?: string
  is_published?: boolean
  imgUrl: string | null
  journal_id?: string
}

// Internal: shape of a row in the pipeline `issues` table. Only used inside src/lib/api.ts.
export interface IssueRow {
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

The only behavioral change to `N8nAiContent` is `tags: string | null` → `tags: string | string[] | null`. Everything else is documentation + the new `IssueRow` export.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: 0 errors (warnings ok).

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "$(cat <<'EOF'
refactor(types): add IssueRow + loosen N8nAiContent.tags

Prep for switching src/lib/api.ts data source from n8n-ai-contents to
the pipeline issues table. N8nAiContent stays as the stable frontend
contract — only tags becomes string | string[] | null to reflect that
the new source returns text[] natively.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Add `mapIssueRow` helper + migrate listing fetchers in `src/lib/api.ts`

**Files:**
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Read current state of api.ts**

Read `src/lib/api.ts` end-to-end to recall exact function shapes.

- [ ] **Step 2: Update imports**

Replace the first line:

```ts
import { supabase, N8nAiContent, SnapAiInsight } from './supabase'
```

with:

```ts
import { supabase, N8nAiContent, SnapAiInsight, IssueRow } from './supabase'
```

- [ ] **Step 3: Add the mapper + base query helper**

Insert these helpers immediately after the existing `IssueSummary` / `TagSummary` / `PaginatedResult` interfaces (around the top section labeled "Existing API: AI Contents"):

```ts
// -----------------------------------------------------------------------------
// Internal helpers — map pipeline `issues` rows to the stable N8nAiContent shape.
// -----------------------------------------------------------------------------

const ISSUE_COLS_LIGHT = 'id, title, summary, published_at, tags, lang, journal_id, cover_image'
const ISSUE_COLS_FULL = 'id, title, summary, content_html, published_at, created_at, tags, lang, journal_id, cover_image, delivered'

function mapIssueRow(row: Partial<IssueRow>): N8nAiContent {
  return {
    id: row.id != null ? String(row.id) : '',
    title: row.title ?? '',
    content: row.content_html ?? '',
    summary: row.summary ?? '',
    tags: row.tags ?? null,
    created_at: row.published_at ?? row.created_at ?? '',
    lang: row.lang,
    is_published: row.delivered,
    imgUrl: row.cover_image ?? null,
    journal_id: row.journal_id != null ? String(row.journal_id) : undefined,
  }
}
```

`ISSUE_COLS_LIGHT` is for list/summary queries; `ISSUE_COLS_FULL` is for detail queries that need `content_html`.

- [ ] **Step 4: Migrate `getAllAiContentsPaginated`**

Replace the existing `getAllAiContentsPaginated` body. Find the function (begins `export const getAllAiContentsPaginated = cache(async (`) and replace with:

```ts
export const getAllAiContentsPaginated = cache(async (
  page: number = 1,
  pageSize: number = 10,
  i18nLang?: string
): Promise<PaginatedResult<IssueSummary>> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let countQuery = supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('channel', 'ai')
    if (dbLang) countQuery = countQuery.eq('lang', dbLang)

    const { count, error: countError } = await countQuery
    if (countError) throw new Error(`Failed to count AI contents: ${countError.message}`)

    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)

    let dataQuery = supabase
      .from('issues')
      .select(ISSUE_COLS_LIGHT)
      .eq('channel', 'ai')
      .order('published_at', { ascending: false })
      .range(from, to)
    if (dbLang) dataQuery = dataQuery.eq('lang', dbLang)

    const { data, error } = await dataQuery
    if (error) throw new Error(`Failed to fetch AI contents: ${error.message}`)

    const rows = (data ?? []) as Partial<IssueRow>[]
    const formattedData: IssueSummary[] = rows.map(row => ({
      id: row.id != null ? String(row.id) : '',
      title: row.title ?? '',
      summary: row.summary ?? '',
      date: formatDate(row.published_at ?? ''),
      tags: extractTagsFromContent(row.tags),
      journal_id: row.journal_id != null ? String(row.journal_id) : ''
    }))

    return { data: formattedData, total, page, pageSize, totalPages }
  } catch (error) {
    console.error('Error in getAllAiContentsPaginated:', error)
    throw error
  }
})
```

- [ ] **Step 5: Migrate `getAllAiContentIds`**

Replace `getAllAiContentIds`:

```ts
export const getAllAiContentIds = cache(async (i18nLang?: string): Promise<{ id: string; journal_id?: string; created_at: string }[]> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)
    let query = supabase
      .from('issues')
      .select('id, journal_id, published_at')
      .eq('channel', 'ai')
      .order('published_at', { ascending: false })
    if (dbLang) query = query.eq('lang', dbLang)
    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch AI content IDs: ${error.message}`)
    const rows = (data ?? []) as Pick<IssueRow, 'id' | 'journal_id' | 'published_at'>[]
    return rows.map(r => ({
      id: String(r.id),
      journal_id: r.journal_id != null ? String(r.journal_id) : undefined,
      created_at: r.published_at,
    }))
  } catch (error) {
    console.error('Error in getAllAiContentIds:', error)
    throw error
  }
})
```

- [ ] **Step 6: Migrate `getAllAiContents`**

Replace `getAllAiContents`:

```ts
export const getAllAiContents = cache(async (i18nLang?: string): Promise<N8nAiContent[]> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)
    let query = supabase
      .from('issues')
      .select(ISSUE_COLS_FULL)
      .eq('channel', 'ai')
      .order('published_at', { ascending: false })
    if (dbLang) query = query.eq('lang', dbLang)
    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch AI contents: ${error.message}`)
    const rows = (data ?? []) as Partial<IssueRow>[]
    return rows.map(mapIssueRow)
  } catch (error) {
    console.error('Error in getAllAiContents:', error)
    throw error
  }
})
```

- [ ] **Step 7: Run lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/lib/api.ts
git commit -m "$(cat <<'EOF'
refactor(api): migrate listing fetchers to issues table

getAllAiContentsPaginated, getAllAiContentIds, getAllAiContents now
read from `issues` (channel='ai') and order by published_at. New
mapIssueRow helper preserves the N8nAiContent contract so consumers
stay untouched.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Migrate detail + summary fetchers in `src/lib/api.ts`

**Files:**
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Migrate `getAiContentByJournalId`**

Replace `getAiContentByJournalId`:

```ts
export const getAiContentByJournalId = cache(async (journalId: string, i18nLang?: string): Promise<N8nAiContent | null> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)
    const numericId = Number(journalId)
    if (!Number.isFinite(numericId)) return null

    let query = supabase
      .from('issues')
      .select(ISSUE_COLS_FULL)
      .eq('channel', 'ai')
      .eq('journal_id', numericId)
    if (dbLang) query = query.eq('lang', dbLang)

    const { data, error } = await query.maybeSingle()
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch AI content: ${error.message}`)
    }
    return data ? mapIssueRow(data as Partial<IssueRow>) : null
  } catch (error) {
    console.error('Error in getAiContentByJournalId:', error)
    throw error
  }
})
```

Key differences from the old logic:
- `Number(journalId)` guarded by `Number.isFinite` because `issues.journal_id` is bigint
- Uses `.maybeSingle()` to avoid PGRST116 noise when row is missing

- [ ] **Step 2: Migrate `getIssueSummaries`**

Replace `getIssueSummaries`:

```ts
export const getIssueSummaries = cache(async (limit: number = 5, i18nLang?: string): Promise<IssueSummary[]> => {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoISO = sevenDaysAgo.toISOString()
    const dbLang = mapI18nLangToDbLang(i18nLang)

    let query = supabase
      .from('issues')
      .select(ISSUE_COLS_LIGHT)
      .eq('channel', 'ai')
      .gte('published_at', sevenDaysAgoISO)
      .order('published_at', { ascending: false })
      .limit(limit)
    if (dbLang) query = query.eq('lang', dbLang)

    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch issue summaries: ${error.message}`)

    const rows = (data ?? []) as Partial<IssueRow>[]
    return rows.map(row => ({
      id: row.id != null ? String(row.id) : '',
      title: row.title ?? '',
      summary: row.summary ?? '',
      date: formatDate(row.published_at ?? ''),
      tags: extractTagsFromContent(row.tags),
      journal_id: row.journal_id != null ? String(row.journal_id) : ''
    }))
  } catch (error) {
    console.error('Error in getIssueSummaries:', error)
    throw error
  }
})
```

- [ ] **Step 3: Migrate `getIssueMonths`**

Replace `getIssueMonths`:

```ts
export const getIssueMonths = cache(async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('issues')
      .select('published_at')
      .eq('channel', 'ai')
      .order('published_at', { ascending: false });

    if (error) throw error;

    const months = new Set<string>();
    (data as { published_at: string | null }[] | null)?.forEach(item => {
      if (item.published_at) {
        const date = new Date(item.published_at);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        months.add(`${year}-${month}`);
      }
    });

    return Array.from(months);
  } catch (error) {
    console.error('Error in getIssueMonths:', error);
    return [];
  }
});
```

- [ ] **Step 4: Migrate `getIssuesByMonth`**

Replace `getIssuesByMonth`:

```ts
export const getIssuesByMonth = cache(async (monthStr: string, i18nLang?: string): Promise<{ id: string; journal_id?: string; created_at: string }[]> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)

    const [year, month] = monthStr.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const endDate = new Date(Date.UTC(year, month, 1)).toISOString();

    let query = supabase
      .from('issues')
      .select('id, journal_id, published_at')
      .eq('channel', 'ai')
      .gte('published_at', startDate)
      .lt('published_at', endDate)
      .order('published_at', { ascending: false });

    if (dbLang) query = query.eq('lang', dbLang)

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as Pick<IssueRow, 'id' | 'journal_id' | 'published_at'>[]
    return rows.map(r => ({
      id: String(r.id),
      journal_id: r.journal_id != null ? String(r.journal_id) : undefined,
      created_at: r.published_at,
    }))
  } catch (error) {
    console.error(`Error fetching issues for month ${monthStr}:`, error);
    return [];
  }
});
```

- [ ] **Step 5: Run lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api.ts
git commit -m "$(cat <<'EOF'
refactor(api): migrate detail + summary fetchers to issues table

getAiContentByJournalId, getIssueSummaries, getIssueMonths,
getIssuesByMonth now read from `issues` (channel='ai') and use
published_at for ordering / month grouping. journal_id is coerced
to Number for the bigint column lookup.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Migrate `getAllTags` to `tag_counts`

**Files:**
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Replace `getAllTags`**

Replace the entire `getAllTags` function with:

```ts
export const getAllTags = cache(async (i18nLang?: string): Promise<TagSummary[]> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)
    let query = supabase
      .from('tag_counts')
      .select('name, total')
      .eq('channel', 'ai')
    if (dbLang) query = query.eq('lang', dbLang)

    const { data, error } = await query.order('total', { ascending: false })
    if (error) throw new Error(`Failed to fetch tags: ${error.message}`)

    return (data ?? []).map(r => ({
      name: String(r.name),
      total: Number(r.total),
    }))
  } catch (error) {
    console.error('Error in getAllTags:', error)
    throw error
  }
})
```

Notes:
- Reads from the pipeline-maintained `tag_counts` table (one row per (channel, lang, name) tuple) instead of aggregating from issues in memory.
- `total` is bigint in PG → returned as string by Supabase JS → coerced to `Number`.
- The previous in-memory aggregation + lowercase normalization is dropped because `tag_counts` is already normalized by the pipeline.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts
git commit -m "$(cat <<'EOF'
refactor(api): getAllTags reads tag_counts instead of aggregating

Pipeline already maintains tag_counts (channel, lang, name, total).
Reading it directly is faster than fetching every issue's tags array
and reducing in memory.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Migrate mailer route to `issues`

**Files:**
- Modify: `src/app/api/send-latest-ai-news/route.ts`

- [ ] **Step 1: Read full current state**

Read `src/app/api/send-latest-ai-news/route.ts` end-to-end (~740 lines) to confirm everything you're replacing.

- [ ] **Step 2: Rewrite `MODES` config**

Find the `MODES` constant block (currently the first `const MODES = { ... } as const;` near the top). Replace the entire block with:

```ts
/**
 * 模式配置 — 现在统一读 pipeline `issues` 表，按 channel 区分。
 */
const MODES = {
  ai: {
    campaignId: 6,
    channel: 'ai',
    displayName: 'AI',
    senderName: '[AI]News',
    timeRestriction: null,
  },
  snow: {
    campaignId: 10,
    channel: 'snow',
    displayName: 'Snow',
    senderName: '[Snow]News',
    timeRestriction: null,
  },
} as const;
```

(`tableName` is removed; replaced with `channel`. `timeRestriction` semantics + commented config left alone.)

- [ ] **Step 3: Rewrite `getLatestZhCNContent`**

Find the function `async function getLatestZhCNContent(table: string)` (around the section labeled "从 Supabase 获取最后一个 lang=zh_CN 的记录"). Replace the entire function with:

```ts
/**
 * 从 Supabase issues 表获取要发送的内容
 * @param channel - 'ai' 或 'snow'
 * @param issueId - 可选：直接指定 issue id；否则取最新的 lang=zh_CN AND delivered=false
 */
async function getIssueForDelivery(channel: string, issueId?: number) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase 环境变量未配置: NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  if (issueId != null) {
    const { data, error } = await supabase
      .from('issues')
      .select('id, title, content_html, published_at, lang, channel')
      .eq('id', issueId)
      .eq('channel', channel)
      .maybeSingle();
    if (error) throw new Error(`Failed to fetch issue ${issueId}: ${error.message}`);
    if (!data) throw new Error(`Issue ${issueId} not found in channel ${channel}`);
    return data;
  }

  const { data, error } = await supabase
    .from('issues')
    .select('id, title, content_html, published_at, lang, channel')
    .eq('channel', channel)
    .eq('lang', 'zh_CN')
    .eq('delivered', false)
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch latest content: ${error.message}`);
  if (!data) throw new Error(`未找到 channel=${channel} 且 lang=zh_CN 且 delivered=false 的 issue`);
  return data;
}
```

- [ ] **Step 4: Delete `updateIsPublished`**

Find the function `async function updateIsPublished(table: string, recordId: string)` and delete it entirely along with its JSDoc comment. mailer no longer writes status — admin/deliver and pipeline deliver step own it.

- [ ] **Step 5: Update `executeMode` to use the new flow**

Find the function `async function executeMode(mode: ModeType)`. Replace its body to use `getIssueForDelivery` and drop the `is_published` update step. Replace from the function declaration through the end of its body with:

```ts
async function executeMode(mode: ModeType, issueId?: number) {
  const modeConfig = MODES[mode];
  const { campaignId, channel, displayName, senderName: defaultSenderName, timeRestriction } = modeConfig;

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
  console.log(`📋 Channel: ${channel}`);
  if (issueId != null) console.log(`📋 Issue ID: ${issueId}`);
  console.log();

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

  // 1. 获取要发送的 issue
  console.log(`📰 正在从 issues 表 (channel=${channel}) 获取内容...`);
  const issue = await getIssueForDelivery(channel, issueId);
  console.log('✅ 获取到 issue:');
  console.log(`   ID: ${issue.id}`);
  console.log(`   标题: ${issue.title}`);
  console.log(`   发布时间: ${issue.published_at}`);
  console.log(`   内容长度: ${issue.content_html?.length || 0} 字符\n`);

  if (!issue.title || !issue.content_html) {
    throw new Error('Issue 缺少标题或内容');
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
    issue.title,
    issue.content_html,
    undefined,
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

  console.log(`\n✅ ${displayName} 模式邮件发送任务完成！`);
  console.log(`   注: delivered 状态由调用方 (admin/deliver 或 pipeline deliver step) 维护`);

  return {
    mode,
    success: true,
    results: sendResults,
    latestContent: {
      title: issue.title,
      createdAt: issue.published_at,
    },
  };
}
```

(Removed the `updateIsPublished` block at the end. Signature gains optional `issueId` param.)

- [ ] **Step 6: Plumb `issue_id` through `handleRequest`**

Find the function `async function handleRequest(request: NextRequest)` and the `executeMode(mode)` call inside its for-loop. Update parameter parsing and the call to forward `issue_id`. Replace the parameter-parsing block (currently just `typeArg`) with:

```ts
    // 获取 type 参数，支持通过查询参数或请求体传递
    const searchParams = request.nextUrl.searchParams;
    let typeArg: string | null = null;
    let issueIdArg: number | undefined;

    if (searchParams.has('type')) {
      typeArg = searchParams.get('type')?.toLowerCase() || null;
    } else if (request.method === 'POST') {
      try {
        const body = await request.json();
        typeArg = body.type?.toLowerCase() || null;
        if (body.issue_id != null) {
          const n = Number(body.issue_id);
          if (Number.isFinite(n)) issueIdArg = n;
        }
      } catch {
        // 如果解析失败，使用默认值
      }
    }
    if (issueIdArg == null && searchParams.has('issue_id')) {
      const n = Number(searchParams.get('issue_id'));
      if (Number.isFinite(n)) issueIdArg = n;
    }
```

Then update the for-loop's `executeMode(mode)` call to pass `issueIdArg`:

```ts
        const result = await executeMode(mode, issueIdArg);
```

- [ ] **Step 7: Run lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 8: Run build**

Run: `npm run build`
Expected: build completes successfully (no type errors).

- [ ] **Step 9: Commit**

```bash
git add src/app/api/send-latest-ai-news/route.ts
git commit -m "$(cat <<'EOF'
refactor(mailer): read issues table, accept issue_id, stop writing status

- MODES uses channel ('ai'/'snow') instead of tableName.
- getIssueForDelivery reads issues with optional issue_id pin,
  default = newest channel/zh_CN/delivered=false.
- Drop updateIsPublished + all is_published writes. delivered state
  is now owned by admin/deliver and pipeline deliver step.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Pass `issue_id` from admin/deliver to mailer

**Files:**
- Modify: `src/app/api/admin/deliver/route.ts`

- [ ] **Step 1: Read current state**

Read `src/app/api/admin/deliver/route.ts` (it's ~80 lines).

- [ ] **Step 2: Pin the mailer URL to the claimed issue**

Find the lines that construct the mailer URL and call fetch:

```ts
  const deliverUrl = DELIVER_URLS[issue.channel];
  if (!deliverUrl) {
```

…and further down…

```ts
    const resp = await fetch(deliverUrl, { method: 'GET', signal: AbortSignal.timeout(30_000) });
```

Replace these two locations. First, change the `deliverUrl` lookup block to:

```ts
  const baseDeliverUrl = DELIVER_URLS[issue.channel];
  if (!baseDeliverUrl) {
```

And change the if-block reference accordingly (the `return NextResponse.json({ error: \`no deliver url for channel ${issue.channel}\` }, ...)` line still uses `issue.channel`, no change there — just confirm the variable rename is consistent). Then, before the fetch call, build the pinned URL:

```ts
    const sep = baseDeliverUrl.includes('?') ? '&' : '?';
    const deliverUrl = `${baseDeliverUrl}${sep}issue_id=${issue.id}`;
    const resp = await fetch(deliverUrl, { method: 'GET', signal: AbortSignal.timeout(30_000) });
```

(The `sep` logic is robust against the constant `DELIVER_URLS` either having or not having existing query params — current values do have `?type=ai`, so it lands as `&`.)

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: build completes successfully.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/deliver/route.ts
git commit -m "$(cat <<'EOF'
fix(admin): pass issue_id to mailer so it sends the claimed row

The mailer's default selection is 'newest undelivered for channel' but
admin/deliver may have claimed a different (e.g. user-picked) issue.
Pinning issue_id avoids the race + mismatch.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Final verification

**Files:** none modified — verification only.

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build completes; no type errors.

- [ ] **Step 3: Start dev server**

Run in a background terminal: `npm run dev`
Expected: server starts on `http://localhost:1717`.

- [ ] **Step 4: Smoke test pages**

In a browser (or curl), verify each URL returns 200 and looks correct:

| URL | Expected |
|---|---|
| `http://localhost:1717/` | Redirects or renders homepage with recent issues |
| `http://localhost:1717/zh-CN` | Homepage in Chinese, recent issues visible |
| `http://localhost:1717/zh-CN/issues` | Paginated issue list (≤10 rows since only 10 imported) |
| `http://localhost:1717/zh-CN/issues/<journal_id>` | Issue detail page renders title/content/imgUrl |
| `http://localhost:1717/zh-CN/tags` | Tag list (driven by tag_counts) |
| `http://localhost:1717/zh-CN/tags/<some_tag>` | Issues filtered by tag |
| `http://localhost:1717/sitemap.xml` | XML sitemap with non-empty URLs |
| `http://localhost:1717/test-supabase` | Debug page; click "测试" button, see issue summaries + raw data |

Pick a real `journal_id` from the issues table: run `SELECT journal_id, title FROM issues WHERE channel='ai' AND lang='zh_CN' ORDER BY published_at DESC LIMIT 3;` against the DB to get one.

- [ ] **Step 5: Admin smoke (dry-safety mode)**

Confirm `DELIVER_LIVE` is not set in `.env.local` (or is `0`). Then:

1. Navigate to `http://localhost:1717/admin/login`, log in with `ADMIN_TOKEN`.
2. Navigate to `http://localhost:1717/admin/issues`.
3. Pick an undelivered issue and click "发送" / "deliver".
4. Expect 200 response with `dry_safety: true`. The issue's `delivered` flips to `true` (UI consistency), but no real email is sent.

If `DELIVER_LIVE != 1`, this path skips the mailer fetch entirely, so we can't fully verify the mailer's `issue_id` plumbing here. To verify mailer specifically: GET `http://localhost:1717/api/send-latest-ai-news?type=ai&issue_id=<id>` directly — it will try to send to Brevo. **Do this only if intentional** (it really sends email). Skip otherwise; production deploy will verify.

- [ ] **Step 6: Final commit (only if any verification fixes needed)**

If steps 1-5 surfaced any issue (e.g., a missed field name), fix inline and commit. If everything passes, **no commit needed**; the prior task commits already capture the work.

- [ ] **Step 7: Push and open PR**

```bash
git push -u origin pipeline-rewrite
gh pr create --title "feat(frontend): cut over to pipeline issues table" --body "$(cat <<'EOF'
## Summary
- src/lib/api.ts and the mailer route now read from the pipeline `issues` table (channel='ai') instead of `n8n-ai-contents`.
- `N8nAiContent` contract stays stable — consumer components untouched.
- `getAllTags` switches to the pipeline-maintained `tag_counts` table.
- Mailer accepts optional `?issue_id=N`; admin/deliver pins it.

See spec: `docs/superpowers/specs/2026-05-16-frontend-cutover-to-issues-design.md`

## Test plan
- [x] npm run lint
- [x] npm run build
- [ ] Local dev smoke: home, issues list, issue detail, tags, sitemap
- [ ] admin/issues dry-safety deliver returns 200
- [ ] (post-merge, production) one real deliver to confirm Brevo path end-to-end

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Plan Self-Review Notes (for the executor — informational)

Coverage vs spec:
- §3 architecture, §4 field mapping, §5 改动清单 A/B/C/D/E — all mapped to Tasks 1-6.
- §6 data flow verified by Task 7 smoke tests.
- §8 testing strategy — limited by no frontend test framework; uses lint + build + manual smoke as the spec itself prescribes.
- §10 risks 4 (id type coercion) — handled in Tasks 2/3 via `String(...)` / `Number.isFinite`.
- §10 risk 6 (SNOW mailer half-path) — preserved by keeping `snow` mode in `MODES`.
- §5E test-supabase: spec said "切表"; verified the file has no direct `from()` call (it consumes via `getIssueSummaries` / `getAllAiContents`), so no edit needed. Smoke-tested in Task 7.
- §10 risk 3 (`issue_id` injection) — `Number.isFinite` guard in Task 5 step 6.

Type / signature consistency:
- `IssueRow` defined in Task 1, imported in Task 2 step 2, used in Tasks 2/3.
- `mapIssueRow` defined in Task 2 step 3, used in Tasks 2/3.
- `ISSUE_COLS_LIGHT` / `ISSUE_COLS_FULL` defined in Task 2 step 3, used throughout.
- `getIssueForDelivery` defined in Task 5 step 3, used in Task 5 step 5; signature `(channel: string, issueId?: number)` consistent.
- `MODES[mode].channel` (Task 5 step 2) used in Task 5 step 5.
