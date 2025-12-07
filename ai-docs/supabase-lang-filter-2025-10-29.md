# Supabase 语言版本过滤实现（2025-10-29）

## 背景
Supabase 表 `n8n-ai-contents` 新增字段 `lang`（取值：`en` / `zh_CN`）用于标记记录语言。前端需根据当前站点语言（i18n：`en` / `zh-CN`）筛选对应语言版本。

## 方案
- 在 `src/lib/supabase.ts` 的类型 `N8nAiContent` 中新增可选字段 `lang?: string`。
- 在 `src/lib/api.ts`：
  - 新增 `mapI18nLangToDbLang` 将 i18n 语言映射为 DB 语言：`zh-CN` → `zh_CN`，`en` → `en`。
  - `getIssueSummaries(limit, i18nLang?)` 支持基于 `lang` 过滤，优先按语言筛选；若未传语言参数，则返回全部。
  - `getAiContentByJournalId(journalId, i18nLang?)` 优先用 `(journalId, lang)` 精确查询，若无结果回退到仅按 `journalId` 查询，避免空页面。
- 在 `src/components/RecentIssues.tsx` 中通过 `i18n.language` 传入当前语言，列表数据按语言过滤。
- 在 `src/components/IssuesList.tsx` 中同样传入当前语言，`/issues` 页面也支持语言过滤。
- 为 `IssuesList` 组件添加了完整的国际化支持，包括所有文本的翻译。

## 非目标改动
- 详情页面 `src/app/issues/[slug]/page.tsx` 当前为服务端组件，无法读取 `localStorage` 中的语言偏好，暂保留原行为（按 `id` 查询）；若需详情页也严格按语言过滤，可改为客户端拉取或在切换语言时将语言写入 Cookie，并在服务端读取。

## 影响面
- 首页/近期期刊列表将按当前语言展示对应版本内容。
- `/issues` 页面现在也支持按语言过滤，显示对应语言版本的内容。
- 类型新增 `lang` 不会破坏旧数据；`lang` 缺失时前端仍可正常渲染（只是在列表中过滤不到）。

## 后续建议
- 如需为详情页强制语言版本：
  1) 切换语言时写入 Cookie（例如 `language=en|zh-CN`），
  2) 服务端读取 Cookie 并传给 `getAiContentByJournalId`。
- 为 `lang` 建立索引以优化查询性能：`CREATE INDEX idx_n8n_ai_contents_lang ON n8n_ai_contents(lang);`
