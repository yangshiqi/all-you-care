// scripts/merge-zack-articles.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const targetSlug = 'anthropic-claude-4-6-token-cost-analysis';
const slugsToDelete = [
  'efficiency-gaslighting-claude-4-6-hidden-tax',
  'the-gaslighting-of-efficiency-claude-4-6'
];

const mergedContent = `
# 效率的煤气灯效应：Anthropic 没告诉你的“隐形税”

> **煤气灯效应 (Gaslighting)**：一种心理操纵手段，通过持续的否认、误导和谎言，让受害者怀疑自己的认知和理智。

Anthropic 发布了 Claude 3.5 Sonnet 4.6。官方博客里写满了 *"Extraordinary performance-to-cost ratio"*（惊人的性价比）和 *"Do it all without increasing cost"*（加量不加价）。

乍一看，这简直是开发者的福音。

但如果你去看看[独立开发者的实测数据](https://substack.com/redirect/787543a4-11f4-4da9-b844-105d3b369538)，你会发现一个被精心隐藏的真相：**Token 消耗量较 4.5 版本剧增 4.8 倍**。

## The Stack Trace (深度解析)

### 1. 重新定义“性价比” (Redefining Value)
Anthropic 在玩一个精妙的文字游戏。
他们所强调的“不增加成本”，是指 **每百万 Token 的单价 ($3 Input / $15 Output)** 没有变化。这在逻辑上无懈可击。

但是，回到工程现场：如果完成同一个 \`fix_bug()\` 任务，以前的模型可能只需要读 1k Token，而 4.6 版本为了达到那 79.6% 的准确率，可能在后台进行了大量的“思维链 (CoT)”推理，消耗了 5k Token 才吐出结果。

**你细品**：单价确实没涨，但“油耗”却变成了原来的 5 倍。对于企业用户来说，这意味着实际的云账单可能会出现**指数级的跳涨**。这不叫性价比，这叫**抢劫**。

### 2. 刷榜工程的代价 (The Cost of Benchmarking)
SWE-Bench **79.6%** 的高分固然亮眼，但我们要问的是：**代价是什么？**
现在的 SOTA 模型越来越像是一个**“为了考试而生”**的怪胎。为了在 Benchmark 上多拿几分，模型架构可能被强制塞入了大量的 **Verbose Chain of Thought** 和 **Self-Correction** 步骤。

这意味着，当你问它 *"1+1=?"* 时，它可能在后台进行了一场小型的哲学辩论：
> *"我现在要计算 1+1。首先定义什么是 1。然后定义加法... 让我反思一下有没有遗漏... 好的，结果是 2。"*

这一大堆“内心戏”，都是你看不见的 Token，但都是你要付的真金白银。引用官方自己的话，这叫 *"Agentic Planning"*；但在老派黑客眼里，这多少带点 **Bloatware (臃肿软件)** 的嫌疑。

### 3. 生态绑架 (Vendor Lock-in)
看看这次发布的配套动作：深度集成 Cline, Windsurf，甚至 Excel MCP。
他们在试图构建一个**围墙花园**。一旦你习惯了这种“昂贵但省心”的 Agent 体验，迁移成本将变得极高。你会被锁死在这个高成本的生态里，成为他们下一份财报的燃料。

## /dev/null (Zack's Take)

> “Anthropic 正在试图驯化我们，让我们接受**‘智能就是昂贵’**的设定。但这违背了黑客精神。好的技术应该是 **Do More With Less**。如果你的 Agent 需要消耗半个核电站才能帮我写一个 CRUD 接口，那你不是在创造未来，你是在挥霍未来。**Show me the efficiency, or shut up.**”

---
*Zack @ SnapAllx*
`;

async function merge() {
  console.log('🚀 Merging Zack Articles...');
  
  // 1. Update Target Article
  const { error: updateError } = await supabase
    .from('snapai_insights')
    .update({ 
      title: '效率的煤气灯效应：Anthropic 没告诉你的“隐形税”',
      content_md: mergedContent,
      updated_at: new Date().toISOString()
    })
    .eq('slug', targetSlug);

  if (updateError) {
    console.error('❌ Update failed:', updateError);
    return;
  }
  console.log(`✅ Updated: ${targetSlug}`);

  // 2. Delete Duplicates
  const { error: deleteError } = await supabase
    .from('snapai_insights')
    .delete()
    .in('slug', slugsToDelete);

  if (deleteError) {
    console.error('❌ Delete failed:', deleteError);
  } else {
    console.log(`🗑️ Deleted duplicates: ${slugsToDelete.join(', ')}`);
  }
}

merge();
