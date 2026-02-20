// scripts/publish-seo-blog.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const articleData = {
  title: "深度分析 Claude 4.6 的“隐形税”：为什么你的 Token 账单翻了 5 倍？",
  slug: "anthropic-claude-4-6-token-cost-analysis",
  excerpt: "官方宣称“性价比惊人”，实测数据却显示资源消耗暴涨。这是 AI 工程化的进步，还是算力通胀的骗局？",
  content_md: `
# 深度分析 Claude 4.6 的“隐形税”：为什么你的 Token 账单翻了 5 倍？

Anthropic 刚刚发布了 [Claude 3.5 Sonnet 4.6](https://www.anthropic.com/news/claude-sonnet-4-6)。如果你只看官方通稿，你会觉得这是上帝的礼物：SWE-Bench 得分刷新至 79.6%，而且官方信誓旦旦地承诺 *"performance-to-cost ratio is extraordinary"*（性价比惊人）。

听起来很美，对吧？

但如果你去看看[独立开发者的实测数据](https://substack.com/redirect/787543a4-11f4-4da9-b844-105d3b369538)，你会发现一个被精心隐藏的真相：**Token 消耗量较 4.5 版本剧增 4.8 倍**。

## The Stack Trace (深度解析)

### 1. 重新定义“性价比” (Redefining Value)
Anthropic 在玩一个文字游戏，堪称**煤气灯效应 (Gaslighting)** 的典范。

他们所说的“不增加成本”，是指 **每百万 Token 的单价 ($3 Input / $15 Output)** 没有变化。这在逻辑上没错，但在工程上是欺诈。
因为完成同一个 \`fix_bug()\` 任务，以前的模型可能只需要读 1k Token，而 4.6 版本为了达到那 79.6% 的准确率，可能在后台进行了大量的“思维链 (CoT)”推理，消耗了 5k Token 才吐出结果。

**结论**：单价没涨，但油耗变成了百公里 50 个油。你的实际云账单，**实实在在地涨了 500%**。

### 2. 刷榜工程的代价 (The Cost of Benchmarking)
SWE-Bench **79.6%** 的高分是怎么来的？
现在的 SOTA 模型越来越像是一个**“为了考试而生”**的怪胎。为了在 Benchmark 上多拿几分，模型架构可能被强制塞入了大量的 **Verbose Chain of Thought** 和 **Self-Correction** 步骤。

这意味着，当你问它 *"1+1=?"* 时，它可能在后台进行了如下思考：
> *"我现在要计算 1+1。首先定义什么是 1。然后定义加法。考虑到皮亚诺公理... 让我反思一下有没有遗漏... 好的，结果是 2。"*

这一大堆废话，都是你看不见的 Token，但都是你要付的真金白银。引用官方自己的话，这叫 *"Agentic Planning"*，但我管这叫 **Bloatware (臃肿软件)**。

### 3. 生态绑架 (Vendor Lock-in)
看看这次发布的配套动作：深度集成 Cline, Windsurf，甚至 Excel MCP。
他们在构建一个**围墙花园**。一旦你习惯了这种“昂贵但省心”的 Agent 体验，你就再也回不去了。你会被锁死在这个高成本的生态里，成为他们下一份财报的燃料。

## /dev/null (Zack's Take)

> “Anthropic 正在试图驯化我们，让我们接受**‘智能就是昂贵’**的设定。但这违背了黑客精神。好的技术应该是 **Do More With Less**。如果你的 Agent 需要消耗半个核电站才能帮我写一个 CRUD 接口，那你不是在创造未来，你是在挥霍未来。**Show me the efficiency, or shut up.**”
`,
  cover_image: "https://placehold.co/1200x630/000000/e11d48?text=TOKEN+OVERFLOW:+The+Cost+of+Claude+4.6&font=mono",
  tags: ['anthropic', 'claude-4-6', 'token-cost', 'swe-bench', 'engineering'],
  related_journal_id: '149',
  author: 'Zack',
  lang: 'zh_CN',
  is_published: true,
  published_at: new Date().toISOString()
};

async function publish() {
  console.log(`🚀 Publishing SEO Article: ${articleData.title}`);
  
  const { data, error } = await supabase
    .from('snapai_insights')
    .upsert(articleData, { onConflict: 'slug' })
    .select()
    .single();

  if (error) {
    console.error('❌ Publish failed:', error);
  } else {
    console.log(`✅ Published! Slug: ${data.slug}`);
  }
}

publish();
