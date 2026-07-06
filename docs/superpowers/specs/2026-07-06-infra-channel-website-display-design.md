# Design: infra 频道网站展示（AI 原生周报）

- **Issue**: [#77](https://github.com/yangshiqi/all-you-care/issues/77)
- **Date**: 2026-07-06
- **Status**: Approved (design), pending implementation plan

## 目标

把 infra 频道（`channel='infra'`，「AI 原生周报」）的周报内容展示在 all-you-care 网站上，作为一个独立频道。当前内容由 pipeline 每周一生成（`infra-weekly.yml`: `merge → render`），产出 `pre_publish` 行 + 渲染好的 `content_html`，但**没有 publish 步骤、也没有前端入口**，因此网站看不到。

## 决策基线（brainstorming 已确认）

1. **范围**：全链路 —— pipeline 接 `publish` + 网站新频道展示。
2. **展示形态**：渲染 pipeline 产出的 `content_html` + 站点补一套 infra-* class 的主题 CSS（与 AI 频道"渲染 content_html"的做法一致）。**不**做原生 React 组件解析 JSON。
3. **路由**：新独立频道 `/[lang]/infra`（列表 + 详情）。

## 架构与数据流

```
cron-job.org → infra-weekly (merge → render → publish)
             → issues 表 (channel='infra', content_html)
             → src/lib/api.ts  getInfraContentsPaginated / getInfraIssueBySlug
             → /[lang]/infra 列表 + /[lang]/infra/[slug] 详情
             → 渲染 content_html（dangerouslySetInnerHTML）+ infra-* 主题 CSS
```

## 组件设计

### 1. Pipeline — 让内容进 `issues` 表
- **改动**：`.github/workflows/infra-weekly.yml` 增加 `publish` job，链路变为 `merge → render → publish`（`publish` `needs: render`，`with: { channel: infra, step: publish }`）。
- **依据**：`pipeline/src/steps/publish.ts` 是 channel 通用的——`claim.forPublish(db, channel.name, 5)` 领取 `pre_publish`，`commit.publish(db, pp.id, 'zh_CN')` 写入 `issues`（含 `content_html`），无 ai 专属逻辑。
- **副作用**：`publish` 会向 `PREVIEW_EMAIL_TO`（bot 地址）发一封 preview 邮件；**不接 `deliver`**，不群发订阅者。
- **幂等**：沿用现有 claim/commit 机制，不新增逻辑。

### 2. 数据层 `src/lib/api.ts` — 按 channel 参数化
- **现状**：约 10 处查询硬编码 `.eq('channel', 'ai')`；`mapIssueRow` / `mapIssueRowToSummary` 本身 channel 无关。
- **改动**：新增 infra 专用查询函数（不改动现有 ai 函数，零回归）：
  - `getInfraContentsPaginated(page, pageSize, i18nLang)` — 列表分页，`channel='infra'`。
  - `getInfraIssueBySlug(slug, i18nLang)` — 按 `journal_id` 取详情（含 `content_html`）。
  - 视需要：`getInfraIssueSlugs()`（SSG/`generateStaticParams`）。
- **复用**：`mapIssueRow` / `mapIssueRowToSummary` / `mapI18nLangToDbLang`（zh_CN 过滤）原样复用。
- **可选重构**：若重复度高，可把 `channel` 提为内部参数（如 `queryIssues(channel, …)`），ai 函数改为薄封装。以不破坏现有 ai 行为为前提。

### 3. 路由/页面 — `/[lang]/infra`
- `src/app/[lang]/infra/page.tsx` — 分页列表，参照 `src/app/[lang]/issues/page.tsx` 的结构（卡片/分页组件复用）。
- `src/app/[lang]/infra/[slug]/page.tsx` — 详情，`dangerouslySetInnerHTML={{ __html: content_html }}` 渲染（同 AI 详情页 `issues/[slug]/page.tsx` 做法）；slug = `journal_id`；含页面 metadata（title/description）用于 SEO。
- 导航：加「AI 原生周报」入口（定位现有 nav 组件后追加）。

### 4. 样式 — infra-* class 的主题 CSS（**本方案主要新增工作**）
- infra `content_html` 使用 class（无内联样式、无 `<style>`），需站点提供 CSS。已知 class（从 `pipeline/src/steps/infraRender.ts` 提取，实现时核对完整）：
  `infra-section` · `section-title` · `infra-item` · `item-head` · `item-title` · `item-score` · `item-maturity` · `item-sources` · `src-link` · `overview-box` · `trend-list` · `rec-list` · `rec-audience` · `empty-note` · `field-label`（及各 item 字段类）。
- **要求**：支持 light/dark（用站点 CSS 变量 / `next-themes` 对齐）；scoped 到 infra 详情容器（如 `.infra-content` 包裹），避免污染全局；移动端可读。
- **实现位置**：全局样式表中的 scoped 段，或 infra 详情页专用 CSS module。

### 5. i18n `src/lib/i18n.ts`
- 加频道名（「AI 原生周报」/ "Cloud-Native AI Weekly" 或定名）、导航项、列表/详情页标题的 `zh-CN` + `en` 文案。

### 6. 上线内容（backfill）
- 本周 `pre_publish` `pp 74` 已生成、未 publish。**默认**：手动跑一次 `infra publish`（或等下周一自动链路）把最新一期发布，使上线即有内容。
- 更早历史（如 `pp 73`）**默认不回填**；如需，单独手动 publish。

## 测试

- **Pipeline**：`npm run cli -- infra publish --dry-run` 验证领取逻辑；真实跑一次确认 `issues` 出 `channel='infra'` 行（含 `content_html`）。
- **Web**：`/[lang]/infra` 列表与 `/[lang]/infra/[slug]` 详情渲染；light + dark 两主题；移动端；zh-CN（en 视文案就绪度）。
- **回归**：确认 AI 频道各页（issues/weekly/tags）不受影响。

## 不在范围

- infra 频道的邮件订阅 / `deliver`（群发）。
- 原生结构化 React 组件（已选 content_html 路线）。
- 站内搜索的 infra 结构化索引（SEO 依赖 content_html + 页面 metadata）。

## 风险 / 权衡

- 唯一"新东西"是第 4 步 infra CSS（AI 的 content_html 自带样式，infra 是 class-based，需补一套）。其余均复用现有模式，回归风险低。
- `dangerouslySetInnerHTML` 渲染 LLM 产出的 HTML：`infraRender` 对所有值 `esc()` 转义、`safeHref` 校验链接，风险可控；实现时仍复核 AI 详情页现有的处理方式保持一致。
