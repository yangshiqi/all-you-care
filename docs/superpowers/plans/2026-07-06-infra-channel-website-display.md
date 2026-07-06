# infra 频道网站展示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 infra 频道（`channel='infra'`，「AI 原生周报」）的周报内容作为独立频道 `/[lang]/infra` 展示在 all-you-care 网站上。

**Architecture:** pipeline 给 `infra-weekly` 接上 channel 通用的 `publish` 步骤，让内容以 `channel='infra'` 落入 `issues` 表（含 `content_html`）；网站数据层 `src/lib/api.ts` 新增 infra 专用查询；新增 `/[lang]/infra` 列表 + 详情页，详情页直接 `dangerouslySetInnerHTML` 渲染 `content_html`，并补一套 `.infra-content` 主题 CSS。

**Tech Stack:** Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 + Supabase (`@supabase/supabase-js`)；pipeline 用 `tsx` CLI（`pipeline/src/cli.ts`）。

## Global Constraints

- **不破坏现有 AI 频道**：只新增 api 函数与页面，不修改现有 `getAll*Ai*` 函数的行为。
- **数据源表**：`issues`（不是 `n8n-ai-contents`）；infra 查询过滤 `channel='infra'`，语言 `lang='zh_CN'`（经 `mapI18nLangToDbLang`）。
- **展示形态**：渲染 pipeline 产出的 `content_html`（经 `mapIssueRow` 映射到 `N8nAiContent.content`）；不做原生 JSON 组件。
- **主题**：新 CSS 必须同时支持 light/dark（用站点现有 CSS 变量），移动端可读。
- **i18n**：至少 `zh-CN`；文案放 `src/lib/locales/en.ts` + `src/lib/locales/zh_CN.ts` 的 `translation` 对象。
- **Web 无单元测试框架**（仅 playwright + `test-build`）：验证 = `npx tsc --noEmit` / `npm run build` / `npm run lint` + 浏览器实测 + 数据层一次性 `tsx` 脚本。
- **slug** = `journal_id`（与 AI 详情页一致）。

---

## File Structure

- Modify: `.github/workflows/infra-weekly.yml` — 增加 `publish` job（`merge → render → publish`）。
- Modify: `src/lib/api.ts` — 新增 `getInfraContentsPaginated` / `getAllInfraContentIds` / `getInfraContentByJournalId`。
- Create: `src/app/[lang]/infra/page.tsx` — infra 列表页（server component）。
- Create: `src/app/[lang]/infra/[slug]/page.tsx` — infra 详情页（server component，渲染 content_html）。
- Create: `src/app/[lang]/infra/infra-report.css` — `.infra-content` 主题 CSS。
- Modify: `src/components/Header.tsx` — 导航加「AI 原生周报」入口（desktop + mobile）。
- Modify: `src/lib/locales/en.ts` + `src/lib/locales/zh_CN.ts` — 加 `nav.infra` 与 `metadata.infra.*`。

---

## Task 1: Pipeline — 接 publish，让 infra 内容进 issues 表（含回填本周）

**Files:**
- Modify: `.github/workflows/infra-weekly.yml`

**Interfaces:**
- Consumes: 现有 `pipeline/src/steps/publish.ts`（channel 通用：`claim.forPublish(db, channel.name, 5)` → `commit.publish(db, pp.id, 'zh_CN')` 写 `issues`）；现有 `pre_publish` 74（本周已 merge+render，未 publish）。
- Produces: `issues` 表中出现 `channel='infra'` 行（含 `content_html`、`journal_id`、`published_at`、`lang='zh_CN'`）。后续 Task 2 的查询依赖它。

- [ ] **Step 1: 验证当前缺口（infra 无 issues 行）**

Run（在 repo 根，`pipeline/.env.local` 已存在）:
```bash
cd /Users/ysq/Work/all-you-care/pipeline
cat > /tmp/check-infra-issues.ts <<'EOF'
import { readFileSync } from 'node:fs';
import { createDb } from './src/lib/db.ts';
for (const l of readFileSync('./.env.local','utf8').split('\n')) { const t=l.trim(); if(!t||t.startsWith('#'))continue; const i=t.indexOf('='); if(i<0)continue; let v=t.slice(i+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1); if(!(t.slice(0,i).trim() in process.env))process.env[t.slice(0,i).trim()]=v; }
const db = createDb();
const { data } = await db.from('issues').select('id,title,channel,journal_id').eq('channel','infra');
console.log('infra issues rows:', (data??[]).length, data);
EOF
npx tsx /tmp/check-infra-issues.ts
```
Expected: `infra issues rows: 0 []`（确认目前网站无 infra 内容可读）。

- [ ] **Step 2: 给 infra-weekly.yml 加 publish job**

修改 `.github/workflows/infra-weekly.yml`，在 `render` job 后加 `publish`（结构参照 `ai-publish.yml`）：
```yaml
  render:
    needs: merge
    uses: ./.github/workflows/_pipeline.yml
    with: { channel: infra, step: render }
    secrets: inherit
  publish:
    needs: render
    uses: ./.github/workflows/_pipeline.yml
    with: { channel: infra, step: publish }
    secrets: inherit
```
（同时把顶部注释 `merge → render` 更新为 `merge → render → publish`。）

- [ ] **Step 3: 本地跑 publish，回填本周（pp 74）并验证 publish 步骤可用**

Run:
```bash
cd /Users/ysq/Work/all-you-care/pipeline
npm run cli -- infra publish
```
Expected: 日志出现 `"event":"publish_ok"`，`pre_publish_id` 74 → 某 `issue_id`。（会向 `PREVIEW_EMAIL_TO` bot 地址发一封 preview 邮件，属预期；不群发订阅者。）

- [ ] **Step 4: 验证 issues 表已有 infra 行**

Run:
```bash
npx tsx /tmp/check-infra-issues.ts
```
Expected: `infra issues rows: 1`，且该行 `channel='infra'`、`journal_id` 非空、`title` 为「[AI 原生周报] …」。记下 `journal_id`（Task 3/4 手测要用）。

- [ ] **Step 5: 提交**

```bash
cd /Users/ysq/Work/all-you-care
git add .github/workflows/infra-weekly.yml
git commit -m "feat(pipeline): wire publish into infra-weekly so content reaches issues (#77)"
```

---

## Task 2: 数据层 — api.ts 新增 infra 查询

**Files:**
- Modify: `src/lib/api.ts`（在 `getIssueSummaries` 函数之后、`// NEW API: SnapAI Insights` 注释之前追加）

**Interfaces:**
- Consumes: 现有 `supabase`、`ISSUE_COLS_LIGHT`、`ISSUE_COLS_FULL`、`mapIssueRow`、`mapIssueRowToSummary`、`mapI18nLangToDbLang`、类型 `IssueLightRow`/`IssueFullRow`/`IssueRow`/`N8nAiContent`/`IssueSummary`/`PaginatedResult`。
- Produces:
  - `getInfraContentsPaginated(page?: number, pageSize?: number, i18nLang?: string): Promise<PaginatedResult<IssueSummary>>`
  - `getAllInfraContentIds(i18nLang?: string): Promise<{ id: string; journal_id?: string; created_at: string }[]>`
  - `getInfraContentByJournalId(journalId: string, i18nLang?: string): Promise<N8nAiContent | null>`

- [ ] **Step 1: 写数据层验证脚本（当前应报"函数不存在"）**

Create `/tmp/check-infra-api.ts`:
```ts
import { getInfraContentsPaginated, getInfraContentByJournalId } from '@/lib/api'
// 用真实 journal_id 替换 <JID>（Task 1 Step 4 记下的）
const list = await getInfraContentsPaginated(1, 10, 'zh-CN')
console.log('list total:', list.total, 'first:', list.data[0]?.title)
const one = await getInfraContentByJournalId('<JID>', 'zh-CN')
console.log('detail:', one?.title, 'content bytes:', one?.content?.length)
```
Run: `cd /Users/ysq/Work/all-you-care && npx tsx --tsconfig tsconfig.json /tmp/check-infra-api.ts`
Expected: 报错（`getInfraContentsPaginated` is not exported / not a function）。

- [ ] **Step 2: 实现三个 infra 查询函数**

在 `src/lib/api.ts` 追加：
```ts
// -----------------------------------------------------------------------------
// infra 频道（AI 原生周报，channel='infra'）
// -----------------------------------------------------------------------------

export const getInfraContentsPaginated = cache(async (
  page: number = 1,
  pageSize: number = 10,
  i18nLang?: string,
): Promise<PaginatedResult<IssueSummary>> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let countQuery = supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('channel', 'infra')
    if (dbLang) countQuery = countQuery.eq('lang', dbLang)
    const { count, error: countError } = await countQuery
    if (countError) throw new Error(`Failed to count infra contents: ${countError.message}`)

    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)

    let dataQuery = supabase
      .from('issues')
      .select(ISSUE_COLS_LIGHT)
      .eq('channel', 'infra')
      .order('published_at', { ascending: false })
      .range(from, to)
    if (dbLang) dataQuery = dataQuery.eq('lang', dbLang)
    const { data, error } = await dataQuery
    if (error) throw new Error(`Failed to fetch infra contents: ${error.message}`)

    const rows = (data ?? []) as IssueLightRow[]
    return { data: rows.map(mapIssueRowToSummary), total, page, pageSize, totalPages }
  } catch (error) {
    console.error('Error in getInfraContentsPaginated:', error)
    throw error
  }
})

export const getAllInfraContentIds = cache(async (
  i18nLang?: string,
): Promise<{ id: string; journal_id?: string; created_at: string }[]> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)
    let query = supabase
      .from('issues')
      .select('id, journal_id, published_at')
      .eq('channel', 'infra')
      .order('published_at', { ascending: false })
    if (dbLang) query = query.eq('lang', dbLang)
    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch infra content IDs: ${error.message}`)
    const rows = (data ?? []) as Pick<IssueRow, 'id' | 'journal_id' | 'published_at'>[]
    return rows.map(r => ({
      id: String(r.id),
      journal_id: r.journal_id != null ? String(r.journal_id) : undefined,
      created_at: r.published_at,
    }))
  } catch (error) {
    console.error('Error in getAllInfraContentIds:', error)
    throw error
  }
})

export const getInfraContentByJournalId = cache(async (
  journalId: string,
  i18nLang?: string,
): Promise<N8nAiContent | null> => {
  try {
    const dbLang = mapI18nLangToDbLang(i18nLang)
    const numericId = Number(journalId)
    if (!Number.isFinite(numericId)) return null
    let query = supabase
      .from('issues')
      .select(ISSUE_COLS_FULL)
      .eq('channel', 'infra')
      .eq('journal_id', numericId)
    if (dbLang) query = query.eq('lang', dbLang)
    const { data, error } = await query.maybeSingle()
    if (error) throw new Error(`Failed to fetch infra content: ${error.message}`)
    return data ? mapIssueRow(data as IssueFullRow) : null
  } catch (error) {
    console.error('Error in getInfraContentByJournalId:', error)
    return null
  }
})
```

- [ ] **Step 3: 运行验证脚本（用 Task 1 的真实 journal_id）**

先把 `/tmp/check-infra-api.ts` 里的 `<JID>` 换成真实值。
Run: `cd /Users/ysq/Work/all-you-care && npx tsx --tsconfig tsconfig.json /tmp/check-infra-api.ts`
Expected: 打印 `list total: 1`、`first: [AI 原生周报] …`、`detail: [AI 原生周报] …`、`content bytes:` 约 36000。

- [ ] **Step 4: 类型检查**

Run: `cd /Users/ysq/Work/all-you-care && npx tsc --noEmit`
Expected: 无新增类型错误（若有既存无关错误，确认不是本改动引入）。

- [ ] **Step 5: 提交**

```bash
git add src/lib/api.ts
git commit -m "feat(web): add infra channel queries to api.ts (#77)"
```

---

## Task 3: infra 列表页 `/[lang]/infra`

**Files:**
- Create: `src/app/[lang]/infra/page.tsx`

**Interfaces:**
- Consumes: `getInfraContentsPaginated`（Task 2）；`Header`（`@/components/Header`）；`isValidLanguage` + `addLanguageToPath`（`@/lib/i18n-utils`）；locales `en`/`zh_CN`（`@/lib/locales/*`）；`t.metadata.infra.{title,description,empty}`（Task 5 会补，先用后加，Task 5 前该页 metadata 会 TS 报缺 key —— 故 Task 5 必须在本页 build 通过前完成，或先在 locales 里加占位）。
- Produces: 路由 `/[lang]/infra`，列表项链接到 `/[lang]/infra/<journal_id>`。

> 注：本页依赖 `t.metadata.infra.*`。**执行顺序**：先做 Task 5 的 locales 增补，再做 Task 3/4 的 build 验证；或在本步先往两个 locale 文件加 `metadata.infra` 三个 key（`title`/`description`/`empty`）。

- [ ] **Step 1: 创建列表页**

Create `src/app/[lang]/infra/page.tsx`:
```tsx
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { getInfraContentsPaginated } from "@/lib/api";
import { isValidLanguage, addLanguageToPath } from "@/lib/i18n-utils";
import { en } from "@/lib/locales/en";
import { zh_CN } from "@/lib/locales/zh_CN";

const translations = { en: en.translation, "zh-CN": zh_CN.translation };

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLanguage(lang)) return { title: "AI 原生周报" };
  const t = translations[lang as "en" | "zh-CN"];
  return { title: t.metadata.infra.title, description: t.metadata.infra.description };
}

export default async function InfraPage({ params }: Props) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) notFound();

  let result;
  try {
    result = await getInfraContentsPaginated(1, 20, lang);
  } catch (error) {
    console.error("Error fetching infra list:", error);
    result = { data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
  }
  const t = translations[lang as "en" | "zh-CN"];

  return (
    <div className="min-h-screen bg-background">
      <Header initialLang={lang as "en" | "zh-CN"} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8 text-center">
            {t.metadata.infra.title}
          </h1>
          {result.data.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">{t.metadata.infra.empty}</p>
          ) : (
            <ul className="space-y-6">
              {result.data.map((issue) => (
                <li key={issue.id} className="vintage-border1 bg-card p-6">
                  <Link
                    href={addLanguageToPath(`/infra/${issue.journal_id}`, lang as "en" | "zh-CN")}
                    className="block group"
                  >
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                      {issue.date}
                    </div>
                    <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {issue.title}
                    </h2>
                    {issue.summary && (
                      <p className="mt-2 text-muted-foreground line-clamp-3">{issue.summary}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: 起 dev server，浏览器验证列表**

Run: `cd /Users/ysq/Work/all-you-care && npm run dev`（端口 1717）。
打开 `http://localhost:1717/zh-CN/infra`。
Expected: 页面标题「AI 原生周报」，列出 1 条（本周 pp 74），点击进入 `/zh-CN/infra/<journal_id>`（此时详情 404 或未样式化，Task 4 处理）。

- [ ] **Step 3: 提交**

```bash
git add src/app/[lang]/infra/page.tsx
git commit -m "feat(web): add /[lang]/infra list page (#77)"
```

---

## Task 4: infra 详情页 + 主题 CSS

**Files:**
- Create: `src/app/[lang]/infra/[slug]/page.tsx`
- Create: `src/app/[lang]/infra/infra-report.css`

**Interfaces:**
- Consumes: `getInfraContentByJournalId` + `getAllInfraContentIds`（Task 2）；`Header`；`isValidLanguage`；`N8nAiContent.content`（= content_html）。
- Produces: 路由 `/[lang]/infra/[slug]`，渲染 content_html。

- [ ] **Step 1: 先核对站点 CSS 变量命名**

Run: `cd /Users/ysq/Work/all-you-care && grep -nE "\-\-(foreground|primary|card|border|muted-foreground|background)" src/app/globals.css | head`
目的：确认变量写法（`--foreground` vs `hsl(var(--foreground))` vs `--color-foreground`）。下一步 CSS 里的 `var(--foreground)` 等按实际命名对齐（若站点用 `hsl(var(--x))`，则写 `hsl(var(--foreground))`）。

- [ ] **Step 2: 创建 infra 主题 CSS**

Create `src/app/[lang]/infra/infra-report.css`（下方变量若 globals.css 用 `hsl(var(--x))` 形式，请整体替换为该形式）:
```css
.infra-content { color: var(--foreground); line-height: 1.8; font-size: 1rem; }
.infra-content .overview-box {
  background: var(--card); border: 2px solid var(--border);
  padding: 1rem 1.25rem; border-radius: 0.5rem; margin-bottom: 1.5rem;
}
.infra-content .infra-section { margin: 2rem 0; }
.infra-content .section-title {
  font-size: 1.4rem; font-weight: 700; color: var(--primary);
  border-bottom: 3px solid var(--primary); padding-bottom: 0.4rem; margin-bottom: 1rem;
}
.infra-content .infra-item {
  border: 1px solid var(--border); border-radius: 0.5rem;
  padding: 1rem; margin-bottom: 1rem; background: var(--card);
}
.infra-content .item-head { display: flex; align-items: baseline; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
.infra-content .item-title { font-size: 1.1rem; font-weight: 600; margin: 0; }
.infra-content .item-score { color: var(--primary); font-weight: 600; font-size: 0.9rem; white-space: nowrap; }
.infra-content .item-maturity {
  font-size: 0.75rem; color: var(--muted-foreground);
  border: 1px solid var(--border); border-radius: 999px; padding: 0.05rem 0.5rem;
}
.infra-content p { margin: 0.4rem 0; }
.infra-content .field-label { font-weight: 600; color: var(--muted-foreground); }
.infra-content .item-sources { margin-top: 0.5rem; font-size: 0.85rem; color: var(--muted-foreground); }
.infra-content .src-link { color: var(--primary); text-decoration: underline; text-underline-offset: 2px; margin-right: 0.5rem; word-break: break-all; }
.infra-content .trend-list, .infra-content .rec-list { padding-left: 1.25rem; }
.infra-content .trend-list li, .infra-content .rec-list li { margin: 0.4rem 0; }
.infra-content .rec-audience { font-weight: 600; color: var(--primary); }
.infra-content .empty-note { color: var(--muted-foreground); font-style: italic; }
```

- [ ] **Step 3: 创建详情页**

Create `src/app/[lang]/infra/[slug]/page.tsx`:
```tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { getInfraContentByJournalId, getAllInfraContentIds } from "@/lib/api";
import { isValidLanguage } from "@/lib/i18n-utils";
import "../infra-report.css";

interface Props {
  params: Promise<{ slug: string; lang: string }>;
}

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  const contents = await getAllInfraContentIds(params.lang);
  const slugs = Array.from(
    new Set(contents.map((i) => i.journal_id || i.id).filter(Boolean)),
  );
  return slugs.map((slug) => ({ slug: String(slug) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lang } = await params;
  const issue = await getInfraContentByJournalId(slug, lang);
  if (!issue) return { title: "Not Found" };
  return { title: issue.title, description: issue.summary };
}

export default async function InfraDetailPage({ params }: Props) {
  const { slug, lang } = await params;
  if (!isValidLanguage(lang)) notFound();
  const issue = await getInfraContentByJournalId(slug, lang);
  if (!issue) notFound();

  const date = issue.created_at ? new Date(issue.created_at).toLocaleDateString("zh-CN") : "";

  return (
    <div className="min-h-screen bg-background">
      <Header initialLang={lang as "en" | "zh-CN"} />
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          <header className="mb-8 text-center">
            <div className="text-sm text-muted-foreground uppercase tracking-widest mb-2">{date}</div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{issue.title}</h1>
          </header>
          <div className="infra-content" dangerouslySetInnerHTML={{ __html: issue.content }} />
        </article>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: 浏览器验证详情 + 主题 + 移动端**

dev server 打开 `http://localhost:1717/zh-CN/infra/<journal_id>`。
Expected: 周报内容分类展示（开篇总览、各分类 items 带 ⭐分数、来源链接、趋势总结、落地建议），排版正常。切换深/浅色主题（ThemeSwitcher）两者都可读；缩到移动宽度不溢出。

- [ ] **Step 5: 提交**

```bash
git add src/app/[lang]/infra/[slug]/page.tsx src/app/[lang]/infra/infra-report.css
git commit -m "feat(web): add infra detail page + themed content CSS (#77)"
```

---

## Task 5: 导航入口 + i18n 文案

**Files:**
- Modify: `src/components/Header.tsx`（desktop nav 与 mobile nav 两处）
- Modify: `src/lib/locales/en.ts`
- Modify: `src/lib/locales/zh_CN.ts`

**Interfaces:**
- Consumes: 现有 `t('nav.*')` 机制、`addLanguageToPath`。
- Produces: `nav.infra` 与 `metadata.infra.{title,description,empty}` 两语言文案；Header 里指向 `/infra` 的链接。

> 若按推荐执行顺序，本 Task 的 locales 增补需在 Task 3/4 的 build 前完成。可先做本 Task 的 Step 1（locales），再回到 Task 3/4。

- [ ] **Step 1: 两个 locale 文件加 key**

在 `src/lib/locales/zh_CN.ts` 的 `translation` 对象中，`nav` 下加 `infra`，`metadata` 下加 `infra`：
```ts
// nav 对象内追加：
    infra: "AI 原生周报",
// metadata 对象内追加：
    infra: {
      title: "AI 原生周报 | [AI]News",
      description: "面向云原生 AI 基础设施工程师的每周要闻：推理引擎、K8s 调度、GPU 虚拟化、国产加速卡与微调框架。",
      empty: "本期暂无内容。",
    },
```
在 `src/lib/locales/en.ts` 对应位置追加：
```ts
// nav:
    infra: "Cloud-Native Weekly",
// metadata:
    infra: {
      title: "Cloud-Native AI Weekly | [AI]News",
      description: "Weekly digest for cloud-native AI infra engineers: inference engines, K8s scheduling, GPU virtualization, domestic accelerators, and fine-tuning frameworks.",
      empty: "No issues yet.",
    },
```
（若 locale 文件对 `translation` 有 TS 类型/接口约束，两个文件的形状必须一致——两边都加同名 key 即可。）

- [ ] **Step 2: Header 加导航链接（desktop + mobile）**

在 `src/components/Header.tsx` desktop `<nav className="hidden md:flex ...">` 里，`weekly` 链接块之后、`tags` 之前插入：
```tsx
            <span className="text-primary text-md">❖</span>
            <Link
              href={addLanguageToPath("/infra", lang)}
              className="hover:text-primary font-medium uppercase tracking-wider transition-colors"
            >
              <TranslatedText>{t('nav.infra')}</TranslatedText>
            </Link>
```
在 mobile `<nav>`（`mobileMenuOpen && ...` 块内），`weekly` 链接块之后插入：
```tsx
            <Link
              href={addLanguageToPath("/infra", lang)}
              className="hover:text-primary font-medium uppercase tracking-wider transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <TranslatedText>{t('nav.infra')}</TranslatedText>
            </Link>
```

- [ ] **Step 3: 生产构建 + lint（整体回归）**

Run:
```bash
cd /Users/ysq/Work/all-you-care
npx tsc --noEmit && npm run lint && npm run build
```
Expected: 类型/lint/build 全通过（`/[lang]/infra` 与 `/[lang]/infra/[slug]` 出现在构建路由中）。

- [ ] **Step 4: 浏览器最终验证**

dev server：首页导航出现「AI 原生周报」→ 点进 `/zh-CN/infra` → 点条目进详情，全链路通；确认 AI 频道（`/zh-CN/issues`、`/zh-CN/weekly`）不受影响。

- [ ] **Step 5: 提交**

```bash
git add src/components/Header.tsx src/lib/locales/en.ts src/lib/locales/zh_CN.ts
git commit -m "feat(web): add infra channel nav entry + i18n strings (#77)"
```

---

## Task 6: 全链路收尾（PR + 上线验证）

**Files:** 无（流程性）

- [ ] **Step 1: 推分支 + 开 PR**

```bash
git push -u origin feat/infra-channel-website-display
gh pr create --base main --title "feat: infra 频道网站展示（AI 原生周报, #77）" --body "Closes #77. 见 docs/superpowers/specs 与 plans。"
```

- [ ] **Step 2: 合并后验证 pipeline 全链路**

合并到 main 后，手动触发一次 `gh workflow run infra-weekly.yml --ref main`（或等下周一），确认 `merge → render → publish` 三步 success，且 Vercel 部署后 `/zh-CN/infra` 展示最新一期。

- [ ] **Step 3: 关闭 issue #77**

确认线上可见后 `gh issue close 77 --comment "已上线：/[lang]/infra 展示 AI 原生周报。"`

---

## Self-Review

**Spec coverage：** 组件1(pipeline publish)→Task1；组件2(api 参数化)→Task2；组件3(路由/页面)→Task3+4；组件4(infra CSS)→Task4；组件5(i18n)→Task5；组件6(backfill)→Task1 Step3；测试→各 Task 验证步 + Task5 Step3/4；不在范围(deliver/原生组件)→未建任务。全部覆盖。

**Placeholder scan：** 无 TBD/TODO；代码块均为可执行内容；CSS 变量命名有显式核对步（Task4 Step1）。唯一"依赖后置"是 Task3/4 用到 `t.metadata.infra.*`（Task5 提供）——已在 Task3/5 用执行顺序注记消歧（先加 locales key 再 build）。

**Type consistency：** api 三函数签名与返回类型（`PaginatedResult<IssueSummary>` / `N8nAiContent | null` / id 列表）在 Task2 定义，Task3/4 按同名消费；`issue.content` = content_html（`mapIssueRow` 映射）一致；`lang as "en" | "zh-CN"` 处理 `isValidLanguage` 收窄。

**已知需实现时确认项（非阻塞）：** ① infra 行的 `issue_type` 值未知——查询只按 `channel` 过滤，故不受影响（Task1 Step4 会看到实际行）。② locale 文件若有 TS 接口约束，两语言需对称加 key（已注明）。③ globals.css 变量写法（Task4 Step1 核对）。
