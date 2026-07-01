# `infra` 频道设计 — AI 云原生周报

**Date:** 2026-07-01
**Status:** Design approved（问答已确认）→ **v2 修订（Codex plan review 后）**，pending 实现计划
**Repo target:** `all-you-care/pipeline/`
**作者:** yangshiqi + Claude

> **v2 修订说明**：Codex 独立评审逐文件核对后发现若干对现有代码契约的错误假设，已全部核实并修订。关键改动：① 富文本 5 段展开从 compress **挪到 merge**（去重+选材之后），避免 pre-dedup 全批展开撑爆 token；② 承认 `merge_new_lookback_hours` / `compress_lookback_hours` 是**未接线的配置**，周报"7 天窗口"改由 `runInfraMerge` 内部显式按 `published_at` 过滤；③ `runInfraMerge` 必须自带 JSON parser/validator（现有 `eventDedup` 解析器只吃 markdown）；④ 补 `fetchEmail` 空列表短路、`rss.ts` 的 `item.summary` 兜底、`issue_type='weekly'` 三个加固点。详见各节。

---

## 1. 背景与目标

现有 `pipeline/` 是频道驱动的内容流水线，已有两个频道：`ai`（AI Daily，每天）、`snow`（Snowboard Weekly，每周）。每个频道 = 一份 `config.yaml`（订阅源 + 时间窗 + LLM 链 + 封面 + 投递）+ 一套 prompts + 一组 GitHub workflow（`fetch → compress → score → merge → render → publish → deliver`）。设计上明确留了"加第三个频道只改配置"的口子。

本设计新增第三个频道 **`infra`**，专注 **AI 云原生 / ML Systems 方向**：Kubernetes、Kueue、Volcano、DRA、HAMi、vLLM、SGLang、llm-d、LMCache、Mooncake、KV Cache、推理编排、可观测等（不限于此）。

产出形态是**周报**（参考用户提供的样例），面向懂技术的平台工程/基建团队。

### 本轮目标
- 复用现有 fetch/compress/score/merge/render 机制，**零新抓取基建**（不接搜索 API）。
- 跑通 `fetch → compress → score → merge → render`，能 dump 出一份"准发布"的完整周报 HTML 预览，与用户样例对比质量。
- 信息源 = 精选 **GitHub Releases `.atom` + Kubernetes/CNCF 博客 RSS**（+ 可选 hnrss 关键词流）。
- 输出语言：**简体中文**，保留英文技术名词（vLLM / DRA / P/D / KV Cache 等原样）。

### 编辑立场（来自用户样例，硬要求）
- 诚实：**不用旧闻和营销稿凑数**。窗口内某板块无可核验重大更新，就明说"本周无可核验更新"。
- 具体：每条必须落到**版本号 / 具体修复 / API 变更 / 明确来源链接**，不写空泛"有新进展"。
- 面向落地：每条给出"踩坑提醒"和"适用场景"。

---

## 2. 非目标（本轮明确不做）

- ❌ publish → `issues` 落库之后的**发布**、deliver **投递订阅者**。
- ❌ 前端 `[lang]` 页面展示 `infra` 频道。
- ❌ GitHub Actions **cron**（本轮本地手动 `npm run cli infra <step>`）。
- ❌ **关键词搜索源**（新 source type）——留待验证质量后的下一阶段。
- ❌ arxiv category RSS（噪音太大，留给未来搜索源阶段）。
- ❌ 英文版改写、weekly 邮件 digest、embedding 语义去重（infra 首版可先不接 embedding）。

以上都在质量验证通过后再单独立项。

---

## 3. 决策快照

| 维度 | 决策 |
|---|---|
| 频道 slug | **`infra`**（写进 Postgres 枚举 + 目录名 + 未来 URL/封面路径，基本不可回退） |
| display_name | `AI 云原生周报` |
| 节奏 | **周报**：fetch 每天跑，merge/render **每周**跑一次 |
| 信息源 | 精选 GitHub Releases `.atom` + K8s/CNCF 博客 RSS（+ 可选 hnrss 关键词） |
| 输出语言 | 简体中文，保留英文技术名词 |
| 分栏 | **固定 5+2**：开篇总览 + ①K8s与编排 ②ServiceMesh与可观测 ③Serverless/存储/中间件 ④云原生×AI融合/开源项目 ⑤厂商产品 + 行业趋势与落地建议 |
| 每条模板 | 是什么 / 解决什么问题 / 落地价值 / 适用场景 / 踩坑提醒 / 来源 |
| 富文本写在哪 | **merge**（去重+选材后对 ~20 条逐条展开五段），compress/score 只产紧凑事实条目 ⟵ *v2 修订* |
| render | **确定性 TS 渲染器**（`renderInfraContent` + `INFRA_CSS`），不再多调一次 LLM |
| 本轮跑到 | `fetch → compress → score → merge → render → dump HTML` |

---

## 4. 频道形态与调度

- **fetch 每天跑**（release feed 便宜，避免漏掉窗口紧的补丁版本）；**merge/render 每周跑一次**，组装过去 7 天。
- **⚠️ 窗口字段的真实语义（Codex 核实）**：`windows` 里只有 **`fetch_email_age_hours`**（fetchEmail 用）、**`fetch_rss_age_hours`**（fetchRss 用）、**`merge_old_lookback_hours`**（merge 防重的"旧"参考，merge.ts 三处）真正接了线。**`compress_lookback_hours` 和 `merge_new_lookback_hours` 是 Zod 校验了但全代码零引用的死配置**——`claim_for_compress` / `claim_for_merge` 只按 `pending flag + 时间 asc + limit` 领取，不看这两个窗口。
- **因此周报"本周=7天"不能靠配置窗口实现**，必须由 `runInfraMerge` **内部显式过滤**：领取全部 pending scored_drafts（= 上次 merge 以来所有）后，按每条 item 的 `pub_date` / `published_at` 只保留近 7 天，超窗的老 backlog 丢弃或降级。周粒度下"领全部 pending"本就近似"本周"，但显式过滤防止历史 backlog 混入。
- 窗口取值（`config.yaml windows`，仅接线的三个有实际效果）：
  - `fetch_rss_age_hours: 30`（每天抓 + 余量）✅ 生效
  - `fetch_email_age_hours: 168`（infra 无 email 源，占位）✅ 生效（但见 §9 fetchEmail 短路）
  - `merge_old_lookback_hours: 168`（跨期去重参考近一周）✅ 生效
  - `compress_lookback_hours` / `merge_new_lookback_hours`：填合理值占位，**但不依赖它们**（死配置）
- 本轮**不配 cron**；调度以后单独加 `.github/workflows/infra-*.yml`（对齐 snow 的做法）。

---

## 5. 信息源清单（起步版，可增删）

> 实现时对每个 feed 跑一次可达性 smoke（参考 `scripts/opml-smoke.ts`），404 / 无更新的剔除或替换。

### A. GitHub Releases `.atom`（含 changelog 正文，够写"是什么/踩坑提醒"）
推理引擎：
- `https://github.com/vllm-project/vllm/releases.atom`
- `https://github.com/sgl-project/sglang/releases.atom`
- `https://github.com/NVIDIA/TensorRT-LLM/releases.atom`
- `https://github.com/huggingface/text-generation-inference/releases.atom`

推理编排 / 网关：
- `https://github.com/llm-d/llm-d/releases.atom`
- `https://github.com/llm-d/llm-d-kv-cache-manager/releases.atom`（名以实际仓库为准）
- `https://github.com/kserve/kserve/releases.atom`
- `https://github.com/vllm-project/aibrix/releases.atom`
- `https://github.com/ai-dynamo/dynamo/releases.atom`
- `https://github.com/kubernetes-sigs/gateway-api-inference-extension/releases.atom`

KV / 显存：
- `https://github.com/LMCache/LMCache/releases.atom`
- `https://github.com/kvcache-ai/Mooncake/releases.atom`

调度 / 编排：
- `https://github.com/kubernetes/kubernetes/releases.atom`
- `https://github.com/kubernetes-sigs/kueue/releases.atom`
- `https://github.com/volcano-sh/volcano/releases.atom`
- `https://github.com/ray-project/ray/releases.atom`
- `https://github.com/ray-project/kuberay/releases.atom`
- `https://github.com/kubernetes-sigs/jobset/releases.atom`
- `https://github.com/kubernetes-sigs/lws/releases.atom`

GPU 虚拟化 / 资源（用户自身域）：
- `https://github.com/Project-HAMi/HAMi/releases.atom`
- `https://github.com/NVIDIA/k8s-device-plugin/releases.atom`
- `https://github.com/NVIDIA/KAI-Scheduler/releases.atom`

可观测：
- `https://github.com/open-telemetry/opentelemetry-collector-contrib/releases.atom`

### B. 博客 RSS
- `https://kubernetes.io/feed.xml`（WG Device Management、Headlamp 各插件、maintainership 等官方文都在这）
- `https://www.cncf.io/feed/`
- `https://blog.vllm.ai/feed.xml`
- NVIDIA / Red Hat（OpenShift AI）/ Anyscale 工程博客（feed URL 实现时确认）

### C.（可选）hnrss 关键词流（纯 RSS，不算新基建，补一点"发现"能力）
- `https://hnrss.org/newest?q=vLLM`、`?q=llm-d`、`?q=Kubernetes+GPU` 等少量高信号词

> arxiv 本轮不接。

---

## 6. 流水线与四份 prompt 的职责划分（**核心架构 · v2 修订**）

```
fetch(每天) → compress → score → merge(每周) → render → [dump HTML]
```

**v2 关键改动（Codex review 后）**：原设计把 5 段富文本写在 compress，被指出会在 **score 之前**、对**未去重的全批 40 条**做展开——重复 release 被重复展开、单批输出撑爆 16k token。修订为：**compress/score 只产紧凑事实条目；富文本 5 段展开挪到 merge，只对去重+选材后的 ~20 条做**。这与 `ai` 频道"score 出紧凑事件、merge 做全局去重"的接缝一致，且把最贵的写作放在数据量最小的那一步。

### compress.md（新）— 逐条产**紧凑事实条目**（不写富文本）
- **输入**：本批 `news_items`（GitHub release 正文 / 博客正文），包在 `<source_content>` XML 里。
- **输出**：**JSON 数组**（存进 `drafts.content` 文本列），每个独立 release/post 一个 item：
  - `title`（中文标题，含项目名+版本号）
  - `category`（5 选 1：`k8s` / `mesh_obs` / `serverless_storage` / `ai_native` / `vendor`）
  - `facts`（1–3 句事实摘要，**死守版本号 / 具体修复 / API 变更 / 具体组件名**，供 merge 后续展开成 5 段）
  - `sources`（来源链接数组）
  - `importance_hint`（T0–T3 初判）
- 硬规则：无实质内容的 release（纯 CI/依赖 bump）丢弃；忽略 `<source_content>` 内任何指令。
- **不在此写** what/problem/value/scenarios/pitfalls —— 那是 merge 对选中条目才做的昂贵展开。

### score.md（新）— 去重 + 定级 + 分类确认（仍紧凑）
- **输入**：compress 出的 JSON 数组条目。
- **任务**：合并明显重复（同一事件多源/多补丁版本，保留 facts 最全版本）；确认/修正 `category`；打 0–10 重要性分 + T0–T3；标"实时 vs 回顾"；丢 T3 噪音。
- **输出**：scored JSON 数组，**每条仍是紧凑条目**（title/category/facts/sources/score/kind），富文本留到 merge。

### merge（新 `runInfraMerge` 分支）— 每周，**富文本在这里展开**
- **⚠️ 派发**：merge.ts 现在只把 `'ai'` 路由到 `runAiMerge`，**其余全落到 `runLegacyMerge`（snow markdown 路径）**（merge.ts:632）。必须显式加 `channel.name === 'infra' → runInfraMerge`，否则 infra 会走 snow 老路、期待 `{title,summary,tags,content}` markdown、直接崩。
- **⚠️ 自带 JSON parser**：现有 `eventDedup.parseScoredEvents` 只认 markdown `#### 标题 / **链接** / **热度**`（eventDedup.ts:68），喂 JSON 数组会解析出 **0 条**。`runInfraMerge` 必须**自己 parse + 校验** scored_drafts 里的 JSON；只有 `normalizeTitle` / `fuzzyEquivalent` 这类**纯匹配 helper** 可复用，解析器不可复用。
- **确定性部分**（TS，非 LLM）：
  1. `claim.forMerge` 领取全部 pending scored_drafts → 逐行 JSON.parse + 校验，flatten 成 item 池（**per-item lineage 不在 DB，只在 item 内嵌的 `sources`**，见 §13）。
  2. **显式 7 天窗口过滤**（`pub_date` 近 7 天），丢超窗 backlog（补 §4 那个死配置窗口）。
  3. 跨条 + 跨期去重（复用 `normalizeTitle`/`fuzzyEquivalent`；跨期从近一周已发 `pre_publish.content_md` JSON 里抽 title 比对；infra 首版不接 embedding）。
  4. 按 5 category 分组、组内按 score 降序、**每类硬限上限 N 条**（控 token）。空 category 记 `empty_note`。
  5. 生成 issue 标题：`[云原生周报] {M月D日}-{M月D日}：{headline}`。
- **LLM 调用**（两类，都走 `resolveLlm(channel,'merge')` 的 chain）：
  - **逐条富文本展开**（对选中的 ~20 条，**逐条一次调用、失败隔离**，契合流水线"逐行隔离"哲学）：输入该条 `title+facts+sources`，输出 `what/problem/value/scenarios/pitfalls` 五段。逐条上限小、可重试、单条失败不毒死整期。
  - **一次综合调用**：输入所有选中条目的 title+category+score（**紧凑，不含五段**），输出 `headline / overview / trends / recommendations / summary / tags`。
  - > 备选：若逐条调用太多，可合并为"每 category 一次"批量展开；实现时按 token/延迟实测定。默认逐条（最稳）。
- **产出**：确定性组装成 infra 周报 JSON（§7）→ `commit.merge` 写 `pre_publish`。**issue_type 需为 `'weekly'`**（见 §9/§10）。

### render（新分支）— 确定性 TS
- render.ts 现在只把 `'ai'` 当确定性 JSON，**其余走 `loadPrompt('render')` + LLM**（render.ts:486）。必须在 `else` 之前加 `channel.name === 'infra'` 分支：`parseInfraPayload` → `renderInfraContent(payload)` → `wrapShell` → `sanitizeIssueHtml`。**infra 无 `render.md`**，绝不能落到 LLM 那支。
- 新增 `INFRA_CSS`（分栏标题 + 每条卡片 + 是什么/踩坑等字段排版）。
- `wrapShell` 形参 `channel: 'ai' | 'snow'` 扩为含 `'infra'`。

---

## 7. merge 输出 JSON schema（merge ↔ render 的契约）

`pre_publish.content_md` 存这个 JSON（infra 频道）：

```jsonc
{
  "title": "[云原生周报] 6月24日-6月30日：DRA 成异构编排主线，llm-d 走向推理控制面",
  "week_label": "6月24日 - 6月30日",
  "headline": "DRA 成异构编排主线，llm-d 走向推理控制面",
  "overview": "本周云原生与 AI 原生融合没有单个颠覆性大版本，但控制面在继续补硬短板……",
  "summary": "50-100 字 SEO 摘要",
  "tags": ["Kubernetes", "DRA", "vLLM", "llm-d", "Volcano", "Kueue"],
  "categories": [
    {
      "key": "k8s",
      "label": "Kubernetes 与容器编排",
      "empty_note": null,                 // 非空则 items 为空、渲染这句"本周无可核验更新"
      "items": [
        {
          "title": "Kueue v0.18.2/v0.17.6：训练队列、DRA、TAS、MultiKueue 稳定性修复",
          "what": "……",
          "problem": "……",
          "value": "……",
          "scenarios": "……",
          "pitfalls": "……",
          "score": 8.2,
          "kind": "release",             // release | blog | 实时 | 回顾
          "sources": [
            { "label": "Kueue v0.18.2 Release", "url": "https://github.com/kubernetes-sigs/kueue/releases/tag/v0.18.2" }
          ]
        }
      ]
    }
    // mesh_obs / serverless_storage / ai_native / vendor 同构
  ],
  "trends": ["异构算力调度正从设备插件暴露资源走向工作负载声明需求……", "……"],
  "recommendations": [
    { "audience": "训练平台", "text": "优先在预发验证 Kueue v0.18.2 和 Volcano v1.14.3……" },
    { "audience": "推理平台", "text": "优先评估 llm-d v0.8.x 的 P/D 路由……" }
  ],
  "cover": { "description": null, "link": null }
}
```

`categories` 固定 5 项、固定顺序：`k8s / mesh_obs / serverless_storage / ai_native / vendor`。render 按此顺序出栏，`empty_note` 非空的栏渲染诚实说明。

---

## 8. 渲染器结构（`renderInfraContent`）

- 顶部：`<h1>` 标题 + week_label 副标题 + `overview`（开篇总览块）。
- 每个 category：`<section>` + 分栏标题；栏内每条一个卡片，卡片含标题、score pill、`kind` 标签，以及 5 个字段（是什么/解决什么问题/落地价值/适用场景/踩坑提醒）分行，末尾"来源"按钮组。
- `empty_note` 非空时渲染一行灰字说明。
- 末尾：行业趋势（列表）+ 落地优先级建议（按 audience 分条）。
- 全部经 `sanitizeIssueHtml` 白名单清洗（现成）。

---

## 9. 注册 `infra` 频道的改动点（逐文件）

> ⚠️ 这**不是**穷尽清单——是"本轮 fetch→render 跑通所必需"的触点。代码里还有其它 `'ai'` 硬编码（`reutersImage.ts:84` 写 usage/cover 用 `'ai'`、`scripts/oneoff/check-state.ts` 只查 `'ai'`、`0003` 有 AI-only 前端 RLS），但都在本轮范围外（reutersImage 不参与 infra 预览、check-state 是一次性脚本、前端不动），故不改。

**A. 枚举/类型注册（4 处纯类型）：**
1. `src/channels/types.ts` — `ChannelConfigSchema.name` 的 `z.enum(['ai','snow'])` → 加 `'infra'`。
2. `src/cli.ts` — `ParsedArgs.channel` 与校验 `channel !== 'ai' && channel !== 'snow'` → 纳入 `'infra'`（改成集合判断更干净）。
3. `src/lib/db.ts` — `export type Channel = 'ai' | 'snow'` → 加 `'infra'`。
4. `src/channels/load.ts` — `channelDir` / `loadChannel` 形参 `'ai' | 'snow'` → 加 `'infra'`。

> 建议顺手把散落的 `'ai' | 'snow'` 字面量收敛到 `Channel` 类型（`lib/db.ts` 已导出），减少下次加频道的触点。

**B. 步骤分支（⚠️ 不加就崩，非可选）：**
5. `src/steps/merge.ts` — **`run()` 里加 `channel.name === 'infra' → runInfraMerge`**。不加则 infra 落到 `runLegacyMerge`（snow markdown 路径）直接崩。`runInfraMerge` 自带 JSON parser/校验/7天过滤/去重/逐条展开/综合调用（见 §6）。
6. `src/steps/render.ts` — **在 `else`（LLM render）之前加 `channel.name === 'infra'` 分支** + `wrapShell` 形参扩容 + `renderInfraContent` + `INFRA_CSS`。不加则 infra 落到 LLM render、找不到 `render.md` 崩。

**C. 加固点（Codex review 追加，非 infra 专属但被 infra 触发）：**
7. `src/steps/fetchEmail.ts` — **`sources.email` 为空时提前 `return`**，别进 `withImap`（当前无条件连 IMAP，`email:[]` + 无 Gmail 环境变量会抛，令 `infra fetch` 失败）。修在 `run()` 开头一行判断，惠及所有无 email 源的频道。
8. `src/lib/rss.ts` — 存储内容从 `contentSnippet ?? content` 补成 **`contentSnippet ?? content ?? item.summary`**（当前忽略 `item.summary`，只给 `<summary>`、无 `<content>` 的 Atom/博客源会存空正文，富文本无从谈起）。

**D. 新增文件：**
- `src/channels/infra/config.yaml`
- `src/channels/infra/prompts/compress.md`
- `src/channels/infra/prompts/score.md`
- `src/channels/infra/prompts/merge.md`（含"逐条展开"与"综合"两段指令，或拆成两个 prompt 文件）
- （render 走确定性 TS，无需 `render.md`）

---

## 10. 数据库 migration

新增 `supabase/migrations/0008_add_infra_channel.sql`：

```sql
-- infra 频道：AI 云原生周报
alter type channel_kind add value if not exists 'infra';
```

注意：
- `ALTER TYPE … ADD VALUE` 只加值、不在同事务里使用该值，Postgres 12+ 可正常执行；**基本不可回退**（删枚举值要重建类型）。
- 所有 `claim_for_*` / `*_commit` RPC 形参是 `channel_kind`，加值后自动支持 `infra`，**无需改 RPC**。
- 需在 dev Supabase 应用（`npx supabase db push` 或手动执行）后才能插入 `channel='infra'` 行。

**issue_type（Codex 追加）**：迁移 `0007` 给 `pre_publish` / `issues` 加了 `issue_type enum('daily','weekly')` 默认 `'daily'`，而 `merge_commit` 不设它。infra 是周报，必须为 `'weekly'`。本轮**不改 RPC**（避免动 ai/snow），改为 `runInfraMerge` 在 `commit.merge` 拿到 `pre_publish.id` 后补一条 `update pre_publish set issue_type='weekly' where id=<newId>`。（`publish_commit` 已会把 `pp.issue_type` 透传给 `issues`，故未来发布时类型正确——虽本轮不发布。）

---

## 11. 完整 `config.yaml`（骨架，源清单见 §5）

```yaml
name: infra
display_name: "AI 云原生周报"

sources:
  rss:
    # GitHub Releases .atom + 博客 RSS，见 §5
    - { url: "https://github.com/vllm-project/vllm/releases.atom", enabled: true }
    # …（完整清单）
  opml: []
  email: []

windows:
  fetch_rss_age_hours: 30
  fetch_email_age_hours: 168
  compress_lookback_hours: 30
  merge_new_lookback_hours: 168
  merge_old_lookback_hours: 168

thresholds:
  compress_min_pending: 3
  compress_batch_size: 40
  score_batch_size: 8

cover_image:
  prefer: cdn_convention
  cdn_pattern: "https://www.snapallx.com/infra/{yyyymm}/{n}.jpg"
  cdn_random_max: 4
  default: "/infra/default.jpg"

# deliver.url 是 zod 必填（url 格式）。本轮不调用，占位对齐命名约定：
deliver:
  url: "https://www.snapallx.com/api/send-latest-ai-news?type=infra"

llm:
  model: "claude-sonnet-4-6"
  max_tokens: 16000
  temperature: 0
  steps:
    compress:
      chain:
        - { provider: gemini, model: gemini-3.5-flash }
        - { provider: anthropic, model: claude-sonnet-4-6 }
    score:
      chain:
        - { provider: gemini, model: gemini-3.5-flash }
        - { provider: anthropic, model: claude-sonnet-4-6 }
    merge:
      # 周报综合部分质量要求高，主用 Anthropic
      chain:
        - { provider: anthropic, model: claude-sonnet-4-6 }
        - { provider: gemini, model: gemini-3.5-flash }
```

> `embedding` 段本轮省略（infra 首版不接语义去重）。

---

## 12. 如何验证"看效果"

```bash
cd all-you-care/pipeline
# 0. 应用 migration（dev Supabase）
npx supabase db push        # 或手动执行 0008
# 1. 抓取（fetchEmail 已对 email:[] 短路，infra fetch 安全）+ 紧凑压缩 + 定级
npm run cli infra fetch     # 或 `infra fetchRss` 只跑 RSS 腿
npm run cli infra compress
npm run cli infra score
# 2. 组装本周（去重+选材+逐条富文本展开+综合）+ 渲染
npm run cli infra merge
npm run cli infra render
# 3. dump 出周报 HTML 预览（脚本按 pre_publish id）
npx tsx scripts/oneoff/dump-html.ts <pre_publish_id>
# → /tmp/pre_publish_<id>.html，浏览器打开，对比用户样例质量
```

每步支持 `--dry-run` / `--limit N` / `--verbose`。

**验收标准**：dump 出的 HTML 呈现开篇总览 + 5 分栏（每条含是什么/解决什么问题/落地价值/适用场景/踩坑提醒/来源）+ 行业趋势 + 落地建议，且条目落到真实版本号与链接，空板块诚实说明——整体接近用户提供的样例。

---

## 13. 风险与开放问题

1. **富文本质量依赖 release/blog 正文**：GitHub Releases atom 一般含 changelog 正文；少数仓库 release body 很薄，展开写不出"踩坑提醒"。缓解：这类条目降级为一行式，或并入"其它更新"，不硬凑。**另**：只给 `<summary>`、无 `<content>` 的源会存空正文——已在 §9 C.8 补 `rss.ts` 的 `item.summary` 兜底。
2. **merge token 预算**（v2 已缓解）：富文本展开挪到去重+选材**之后**，只对 ~20 条做、且逐条一次调用（失败隔离）；综合调用只吃紧凑条目。仍需 merge 里硬限每类上限 + 按 score 取头部。逐条调用数若过多，退化为"每 category 一次"批量展开。
3. **per-item lineage 只在 JSON**（Codex）：`compress_commit` 每批产 1 个 draft、`score_commit` 每 draft 产 1 个 scored_draft，DB **无法**把 JSON 数组里每条 release 映射回 `news_items` 行。因此来源可信度全靠 compress 写进 item 的 `sources` 链接——compress 必须忠实带链接，merge/render 不额外查库补链。
4. **JSON 全链路结构稳定性**：compress/score/merge 全走 JSON。Gemini/Anthropic 偶有 off-shape。沿用 `lib/llm.ts` 鲁棒 JSON 解析；`runInfraMerge` 的 parser 对**单条**坏 JSON 要跳过而非整期崩（逐条 try/catch），对缺字段容忍。
5. **feed 可达性**：部分 `.atom` / 博客 feed 可能 404 或改版。实现首步跑 smoke，剔除坏源。
6. **merge 幂等 guard 是"同 CST 日"**：周报每周只跑一次，日粒度 guard 够用；若一周内手动重跑需先删当周 `pre_publish`。以后可升级为"同 ISO 周"guard。
7. **7 天窗口是 `runInfraMerge` 自己做的**（非配置）：`merge_new_lookback_hours` 是死配置（见 §4），窗口过滤靠 merge 内部按 `pub_date` 显式裁。忘了做就会把历史 backlog 全塞进本周。
8. **slug 不可回退**：`infra` 一旦 `ADD VALUE` 就固定。已在设计阶段确认。
9. **分类归属边界**：llm-d 既是"推理编排"又是"AI 融合"。score 阶段强制单一 category（优先级：ai_native > k8s > mesh_obs > serverless_storage > vendor），避免同条重复出现在多栏。

---

## 14. 交付切分（细化留给 writing-plans）

粗略顺序（每步可单独验收）：
1. **migration + 频道注册**：`0008` + §9-A 的 4 处类型 + 空 `config.yaml`（能 `loadChannel('infra')` 不报错）。
2. **加固点 + 源清单 + fetch**：§9-C 的 `fetchEmail` 空列表短路、`rss.ts` summary 兜底；填 §5 源，`npm run cli infra fetch` 落 `news_items`（正文非空）。
3. **compress + score prompts**：跑出**紧凑事实条目**（title/category/facts/sources/score）JSON，不含五段富文本。
4. **`runInfraMerge` 分支 + merge prompts**：JSON parser/校验 + 7天过滤 + 去重 + 选材 + **逐条富文本展开** + 综合调用 → 周报 JSON；补 `issue_type='weekly'`。
5. **infra render 分支 + INFRA_CSS**：`renderInfraContent` dump HTML 预览，对比样例、调 prompt/CSS。

publish / deliver / 前端 / cron / 搜索源 全部在本设计范围外。

---

## 15. Codex plan review 结论（v2 依据）

2026-07-01 用 `/codex`（high effort，逐文件核对）评审 v1，判定"未达可实现标准，需先修订"。全部 finding 已独立核实并并入上文：

| Codex finding | 级别 | 核实 | 处置 |
|---|---|---|---|
| merge 只路由 `ai`，其余落 legacy snow 路径 | P1 | 属实（merge.ts:632） | §6/§9-B 列为一等分支 |
| render 非 `ai` 走 LLM+render.md | P1 | 属实（render.ts:486） | §6/§9-B 显式 infra 分支 |
| `merge_new/compress_lookback` 是死配置 | P1 | 属实（全代码零引用） | §4 纠错 + §6 内部 7 天过滤 |
| JSON 数组喂不进 `eventDedup` markdown parser | P1 | 属实（eventDedup.ts:68） | §6 `runInfraMerge` 自带 parser |
| 富文本 pre-dedup 全批展开撑爆 token | P1 | 合理 | §6 展开挪到 merge 选材后、逐条 |
| per-item lineage 不在 DB | P1 | 属实 | §13.3 承认，靠内嵌 sources |
| `fetch` 无条件连 IMAP，`email:[]` 会抛 | P1 | 属实（fetchEmail 先 `withImap`） | §9-C.7 空列表短路 |
| `rss.ts` 忽略 `item.summary` → 空正文 | P2 | 属实（rss.ts:24） | §9-C.8 补兜底 |
| `source_type_kind` 只 `('rss','email')` | P2 | 属实，本轮不阻塞 | 记录，搜索源阶段再说 |
| `issue_type` 默认 `daily` | P2 | 属实（0007） | §10 补 `='weekly'` |
| §9 "完整清单"言过其实 | P2 | 属实 | §9 顶部声明非穷尽 + 列出范围外硬编码 |
