// scripts/publish-anthropic-intel.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ylcjjcfopcuwtspiiytl.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsY2pqY2ZvcGN1d3RzcGlpeXRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA3NTc4NiwiZXhwIjoyMDc2NjUxNzg2fQ.Dep80iM9c8JwaNQwTn1AGpOWQAdPafsV-UoV2QatKDE";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const articleTitle = "智力“寄生”与数字刺刀：Anthropic 揭露的 AI 间谍战";
const articleSlug = "anthropic-distillation-attack-intel";
const articleExcerpt = "Anthropic 首次公开点名 DeepSeek、月之暗面与 MiniMax，揭露其通过 24000 个虚假账号提取 Claude 的核心推理与编码能力。当智力蒸馏演变为地缘政治中的“工业间谍活动”。";

const articleBody = `
# 智力“寄生”与数字刺刀：Anthropic 揭露的 AI 间谍战

这不再是技术极客之间的“借用”，而是一场不折不扣的智力抢劫。

Anthropic 在最新的[调查报告](https://www.anthropic.com/news/detecting-and-preventing-distillation-attacks)中丢下了一枚重磅炸弹：他们通过 IP 关联、元数据分析和基础架构追踪，锁定了三家中国顶级 AI 实验室——**DeepSeek、月之暗面 (Moonshot AI) 和 MiniMax**——针对 Claude 发起了“工业规模”的蒸馏攻击（Distillation Attacks）。

### 1,600 万次“搬运”与 24,000 个“幽灵”

报告显示，这三家公司通过超过 24,000 个虚假账户，与 Claude 进行了超过 **1,600 万次** 交互。他们的目标非常明确：**提取 Claude 最核心、最具差异化的能力——代理推理（Agentic Reasoning）、工具使用和编码逻辑。**

*   **MiniMax (1,300 万次)**：主要目标是 Agent 编码与编排能力。
*   **Moonshot (340 万次)**：侧重于 Agent 推理、编码以及计算机控制（Computer Use）。
*   **DeepSeek (15 万次)**：规模虽小，但最为阴狠。他们通过提示词诱导 Claude “写出内部推理步骤（CoT）”，并利用 Claude 生成“符合审查标准”的政治敏感查询回复，以此训练自己的模型进行政治规避。

### 从“蒸馏”到“刺刀化”

Anthropic 并没有将这仅仅视为商业侵权，而是将其上升到了**国家安全**的高度。他们认为：
1.  **脱敏安全风险**：被非法蒸馏的模型往往剥离了 Anthropic 注入的安全对齐，可能被用于制造生物武器或发起网络攻击。
2.  **规避出口管制**：中国实验室正在通过蒸馏美国顶级模型，填补由芯片禁令带来的算力与智力鸿沟。这直接挑战了美国的“智力霸权”。

## /dev/null (主编 Zack 点评)

> “**醒醒吧，‘蒸馏’在学术界是美德，在万亿美金的 AGI 赛场上就是‘智力寄生’。当 DeepSeek 用 1/10 的成本达到 SOTA 时，Anthropic 告诉了你真相：那是建立在对 Claude 逻辑链条大规模‘拆解与克隆’基础上的。这是一场数字时代的工业间谍战，而‘安全’不过是 Anthropic 保护其商业护城河的一层体面外衣。真正的看点在于：既然规则已经摆上桌面，API 的封闭与审查将不可避免地加速。**”

## 评审员异议 (独立评审员 Brad)

> “**Zack，别被 Anthropic 的受害者叙事带跑了。这篇文章发布的时机极其微妙——正是 DeepSeek V3 席卷全球、导致美国科技股剧震之后。Anthropic 现在的做法是典型的‘打不过就扣帽子’。把技术赶超归结为‘偷窃’，把开源竞争归结为‘安全威胁’，这不仅是 PR 攻势，更是为了游说政府收紧 API 出口政策。在 AI 领域，没有谁的知识产出是绝对纯净的。所谓的‘攻击’，本质上是打破了硅谷对智力霸权的垄断。加速竞争，才是对用户最有利的。**”
`;

const coverImageUrl = "/images/blog/anthropic-distillation-cover.png";

async function publish() {
  console.log(`🚀 Publishing: ${articleTitle}`);
  
  const { data: existing } = await supabase
    .from('snapai_insights')
    .select('id')
    .eq('slug', articleSlug)
    .single();

  let result;
  if (existing) {
    console.log(`🔄 Updating existing article ID: ${existing.id}`);
    result = await supabase
      .from('snapai_insights')
      .update({
        title: articleTitle,
        excerpt: articleExcerpt,
        content_md: articleBody,
        cover_image: coverImageUrl,
        tags: ['Anthropic', 'DeepSeek', 'Moonshot', 'MiniMax', 'Distillation', 'AI Security', 'Geopolitics'],
        author: 'Zack',
        related_journal_id: '417',
        lang: 'zh_CN',
        is_published: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    console.log(`🆕 Inserting new article`);
    result = await supabase
      .from('snapai_insights')
      .insert({
        title: articleTitle,
        slug: articleSlug,
        excerpt: articleExcerpt,
        content_md: articleBody,
        cover_image: coverImageUrl,
        tags: ['Anthropic', 'DeepSeek', 'Moonshot', 'MiniMax', 'Distillation', 'AI Security', 'Geopolitics'],
        author: 'Zack',
        related_journal_id: '417',
        lang: 'zh_CN',
        is_published: true,
        published_at: new Date().toISOString()
      })
      .select()
      .single();
  }

  if (result.error) {
    console.error('❌ Publish failed:', result.error);
  } else {
    console.log(`✅ Published successfully! ID: ${result.data.id}`);
  }
}

publish();
