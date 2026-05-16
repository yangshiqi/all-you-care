# n8n AI News Pipeline Architecture

> 工作流目录: `/Users/ysq/Work/workflow/n8n/ainews/`
> 最后更新: 2026-03-29

## 总览

6 步自动化管道，从 25+ RSS 源和邮件中抓取 AI 新闻，经过 AI 分类、评分、去重、翻译后发布到 Supabase，支持中英双语。

```
25+ RSS 源 + Reuters 邮件 + GitHub OPML
        ↓
    Step 1: 抓取 & 解析（4小时窗口，每小时）
        ↓
    n8n-ai-newsfeed（原始文章）
        ↓
    Step 2: 压缩 & 分类（Gemini Pro → 8 个 AI 分类）
        ↓
    n8n-ai-content-drafts（中文分类内容）
        ↓
    Step 2.1: 评分 & 排名（Claude → T0-T3 四级）
        ↓
    n8n-ai-draft-scores（评分 + 格式化）
        ↓
    Step 3: 合并 & 去重（72小时窗口，Claude）
        ↓
    n8n-ai-content-pre-publish（终稿）
        ↓
    Step 4: 图片 + 英文翻译（Gemini Pro）
        ↓
    n8n-ai-contents（发布版，中英双语）
        ↓
    Step 5: 标签更新 + 邮件投递
```

---

## 工作流文件清单

| 文件名 | 阶段 | 功能 |
|--------|------|------|
| `[AI] Step 1 - Fetch news.json` | 抓取 | 主 RSS 抓取（25+ 源） |
| `[AI] Step 1 - Fetch news (Dynamic Optimized).json` | 抓取 | 动态 RSS 抓取（GitHub OPML） |
| `[AI] Step 1.1 - Fetch emails.json` | 抓取 | 邮件内容提取（Reuters Daily Brief） |
| `[AI] Step 1.1 - Generate Image from Reuters.json` | 抓取 | Reuters 邮件图片提取 |
| `[AI] Step 2 - Compress news.json` | 处理 | AI 分类 & 压缩 |
| `[AI] Step 2.1 Score.json` | 处理 | AI 评分 & 排名 |
| `[AI] Step 3 - Merge.json` | 合并 | 内容合并 |
| `[AI] Step 3 - Merge (Ultimate Fix).json` | 合并 | 去重 & 合并（生产版） |
| `[AI] Step 4 - Publish.json` | 发布 | 发布工作流 |
| `[AI] Step 4.1 - Fetch ImgUrl.json` | 发布 | 封面图 URL 生成 |
| `[AI] Step 4.2 - EN.json` | 发布 | 英文翻译 & 发布 |
| `[AI] Step 5 - tags.json` | 后处理 | 标签更新调度器 |
| `[AI] Step 5.1 - zh_CN tags.json` | 后处理 | 中文标签聚合 |
| `[AI] Step 5.2 - EN tags.json` | 后处理 | 英文标签聚合 |
| `[AI] Step 0.1 - zh_CN tags.json` | 后处理 | 中文标签处理 |
| `[AI] Step 0.2 - EN tags.json` | 后处理 | 英文标签处理 |
| `[AI] Step 5 - Podcast.json` | 扩展 | 播客生成（未完成） |
| `[AI] Step 5 Deliver.json` | 投递 | 邮件投递（当前 INACTIVE） |
| `vercel.sql` | 基础设施 | 数据库 schema |

---

## Stage 1: 数据抓取

### Step 1 — RSS 抓取

**触发:** 每小时

**数据源（25+）:**

中文源:
- 极客公园、36kr、Inside Taiwan、TMTPost、CNBeta

英文源:
- The Verge、TechCrunch、Hacker News、Wired
- Microsoft Research、Google AI Blog、MIT AI News
- MarketTechPost、AnalyticsVidhya、AI Intelligence News
- Edge AI Vision、Thoughtworks Engineering/Insights

风投/融资:
- a16z News、PitchBook AI

元聚合:
- Google News (AI topic)、Substack (AI Quantum Computing)

动态源:
- GitHub OPML 列表（HN Popular Blogs 2025），通过 `[AI] Step 1 - Fetch news (Dynamic Optimized).json` 获取

**处理逻辑:**
1. 并行读取所有 RSS 源
2. 过滤最近 4 小时内发布的文章
3. 提取字段: title, content, pubDate, source domain, link
4. 在 Supabase 中按 title 去重
5. 新文章写入 `n8n-ai-newsfeed` 表

**错误处理:** 单个源失败不阻塞整体流程 (`onError: continueRegularOutput`)

### Step 1.1 — 邮件抓取

**触发:** 每天 20:05

**来源:** Thomson Reuters Daily Brief (`dailybriefing@thomsonreuters.com`)

**处理逻辑:**
1. 从 Gmail 获取最新邮件
2. JavaScript 提取 "And Finally..." 部分
3. Gemini Flash 提取结构化数据: `{description, imgUrl, link}`
4. 存入 `n8n-ai-imgs` 表
5. 标记邮件为已读

---

## Stage 2: AI 处理

### Step 2 — 压缩 & 分类

**触发:** 每小时（偏移 +10 分钟）

**AI 模型:** Google Gemini 3.1 Pro

**处理逻辑:**
1. 获取最近 12 小时未处理的文章
2. 文本清洗:
   - 移除 HTML（保留关键标签）
   - 清除 Markdown 格式
   - 折叠空白字符、移除不可见 Unicode
3. 按时间排序，拼接为 Markdown
4. AI 分类为 8 个类别:
   - 大模型 (LLMs)
   - 开源技术 (Open Source)
   - AI基础设施 (Infrastructure)
   - 机器人 (Robotics)
   - 自动驾驶/无人机 (Autonomous/Drones)
   - AI安全 (AI Safety)
   - AI医疗 (AI Medicine)
   - AI产业/政策 (Industry/Policy)
5. 翻译为中文，保留原始链接
6. 存入 `n8n-ai-content-drafts`（lang: zh_CN）

### Step 2.1 — 评分 & 排名

**触发:** 每小时（偏移 +20 分钟）

**AI 模型:** Anthropic Claude (kimi-for-coding)，双 Agent 冗余（temperature 0.5 主 + temperature 0 备）

**评分体系:**

| 等级 | 分数 | 标准 | 示例 |
|------|------|------|------|
| T0 | 9.0-10 | 行业定义级 | GPT-5 发布、重大并购 |
| T1 | 7.5-8.9 | 战略基础设施 | 新模型发布、HBM 芯片 |
| T2 | 6.0-7.4 | 实用更新 | 工具、Agent 更新 |
| T3 | <6.0 | 低价值/噪音 | — |

**输出格式（每条新闻）:**
```json
{
  "title": "⭐ Score/10",
  "原文": "Summary",
  "链接": "[Link1](URL1) | [Link2](URL2)",
  "点评": "Deep insight"
}
```

存入 `n8n-ai-draft-scores` + `n8n-ai-draft-score-contents`

---

## Stage 3: 合并 & 去重

### Step 3 — Merge (Ultimate Fix)

**触发:** 工作日 8:30 + 19:30，周六 9:00，周日 20:00

**AI 模型:** Anthropic Claude (kimi-for-coding)，temperature 0

**处理逻辑:**
1. 获取最近 72 小时未发布的评分内容
2. 获取最近 72 小时已发布的内容
3. 合并两个数据集
4. AI 处理:
   - 对比已发布内容去重
   - 合并内部重复（保留最高分）
   - 按主题分类
   - 生成最终 Markdown
   - 生成元数据: title, summary, tags

**输出:**
```json
{
  "title": "AI简报: [Catchy Title]",
  "summary": "[Executive Summary]",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "content": "[Combined Markdown with categories]"
}
```

存入 `n8n-ai-content-pre-publish`

---

## Stage 4: 发布

### Step 4 — 发布流程

将 `n8n-ai-content-pre-publish` 中的内容移到 `n8n-ai-contents` 表。

### Step 4.1 — 封面图

**逻辑:**
- 生成 URL 模式: `https://www.snapallx.com/ainews/YYYYMM/{0-7}.jpg`
- 随机选择（每月 8 张图可选）
- HTTP HEAD 验证图片存在
- 更新 `n8n-ai-content-pre-publish.imgUrl`

### Step 4.2 — 英文翻译

**AI 模型:** Google Gemini 3.1 Pro（主），AI Agent + 结构化解析器（备用）

**处理逻辑:**
1. 获取未翻译的中文内容
2. 检查英文版是否已存在
3. 翻译字段: title, content, summary, tags
4. 创建英文记录（lang: "en"）
5. 通过 Gmail 发送到 `yangshiqi1089@gmail.com`
6. 标记为已发布

---

## Stage 5: 后处理 & 投递

### Step 5 — 标签聚合

**触发:** 每天 8:30 + 20:30

分别处理中文和英文内容的标签:
- 解析每条内容的 tags JSON 数组
- 统计每个标签出现次数
- 去重合并
- 写入 `n8n-ai-tags` 表

### Step 5 Deliver — 邮件投递

**当前状态: INACTIVE**

通过 `https://www.snapallx.com/api/send-latest-ai-news?type=ai` 触发邮件投递。

---

## Supabase 表结构

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| `n8n-ai-newsfeed` | 原始 RSS 文章 | title, content, pubDate, source, link, compressed |
| `n8n-ai-imgs` | 提取的图片 | description, imgUrl, link |
| `n8n-ai-content-drafts` | AI 分类后内容 | content, lang, is_scored |
| `n8n-ai-draft-scores` | 评分内容 | content, lang, is_merged |
| `n8n-ai-draft-score-contents` | 评分详情 | draftId, content, links |
| `n8n-ai-content-pre-publish` | 发布前终稿 | title, summary, content, tags, lang, imgUrl, journal_id |
| `n8n-ai-contents` | 已发布内容 | title, content, summary, tags, lang, is_published, imgUrl, journal_id, embedding |
| `n8n-ai-tags` | 标签索引 | name, total, lang |
| `n8n-draft-tmp-ids` | 临时 ID 追踪 | draft IDs |
| `n8n-ai-new-podcasts` | 播客元数据 | script, host, title, summary, voice |
| `snapai_insights` | Insight 文章 | title, slug, content_md, excerpt, cover_image, tags, lang, embedding |

---

## AI 模型使用

| 模型 | 阶段 | 温度 | 用途 |
|------|------|------|------|
| Gemini 3 Flash | Step 1.1 | — | 邮件图片结构化提取 |
| Gemini 3.1 Pro | Step 2, 4.2 | 0-0.3 | 内容分类、英文翻译 |
| Claude (kimi-for-coding) | Step 2.1, 3 | 0-0.5 | 评分、合并、去重 |

---

## 调度时间表

| 工作流 | 频率 | 时间 |
|--------|------|------|
| Step 1 抓取 | 每小时 | 整点 |
| Step 1 动态抓取 | 每小时 | 整点 |
| Step 1.1 邮件 | 每天 | 20:05 |
| Step 2 压缩 | 每小时 | 整点 +10min |
| Step 2.1 评分 | 每小时 | 整点 +20min |
| Step 3 合并 | 工作日 2 次，周末 1 次 | 工作日 8:30/19:30，周六 9:00，周日 20:00 |
| Step 4.1 图片 | 按需 | 由 Step 4 触发 |
| Step 4.2 翻译 | 按需 | 由 Step 4 触发 |
| Step 5 标签 | 每天 2 次 | 8:30/20:30 |
| Step 5 投递 | 工作日 2 次，周末 1 次 | 工作日 9:00/20:00，周六 9:00，周日 20:00 |

时区: Asia/Shanghai

---

## 凭证引用

| 服务 | 用途 |
|------|------|
| Supabase | 全部数据存储（10+ 表） |
| Gmail OAuth2 | 读取 Reuters 邮件、发送翻译结果 |
| Google Gemini API | 分类、翻译、图片提取 |
| Anthropic API | 评分、合并、去重 |

---

## 质量控制机制

- **时间窗口去重:** RSS 只取最近 4 小时，合并对比最近 72 小时已发布内容
- **标题去重:** Step 1 按标题检查是否已存在
- **AI 去重:** Step 3 用 Claude 识别并合并重复事件（保留最高分版本）
- **评分过滤:** 只有评分后的内容才能进入合并阶段
- **双语质量:** 英文翻译使用 Gemini Pro + 结构化输出解析器，带备用 Agent 兜底
- **错误隔离:** 单个 RSS 源失败不阻塞整体流程
