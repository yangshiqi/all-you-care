// scripts/update-zack-claude-cost.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const updatedContent = `
# 效率的煤气灯效应：Anthropic 没告诉你的“隐形税”

> **煤气灯效应 (Gaslighting)**：一种心理操纵手段，通过持续的否认、误导和谎言，让受害者怀疑自己的认知和理智。

Anthropic 发布了 [Claude 3.5 Sonnet 4.6](https://www.anthropic.com/news/claude-sonnet-4-6)。官方博客里写满了 *"Extraordinary performance-to-cost ratio"*（惊人的性价比）和 *"Do it all without increasing cost"*（加量不加价）。

乍一看，这简直是开发者的福音。

但如果你去读一读 [Artificial Analysis 的深度评测](https://artificialanalysis.ai/articles/claude-sonnet-4-6-gdpval)，你会发现一个被精心隐藏的真相：**Token 消耗量较 4.5 版本剧增 4.8 倍**。

## The Stack Trace (深度解析)

### 1. 重新定义“性价比” (Redefining Value)
Anthropic 在玩一个精妙的文字游戏。
他们所强调的“不增加成本”，是指 **每百万 Token 的单价 ($3 Input / $15 Output)** 没有变化。这在逻辑上无懈可击。

但是，回到工程现场：根据 Artificial Analysis 在 GDPval-AA 基准测试中的数据，完成同样的 Agent 任务：
*   **Sonnet 4.5** 消耗了 **58M Tokens**。
*   **Sonnet 4.6** 消耗了 **280M Tokens**。

**你细品**：单价确实没涨，但“油耗”却变成了原来的 5 倍。对于企业用户来说，这意味着实际的云账单可能会出现**指数级的跳涨**。甚至在某些场景下，使用“便宜”的 Sonnet 4.6，总成本竟然比使用“昂贵”的 Opus 4.6 还要高。这不是性价比，这是**倒挂**。

### 2. “自适应思维”还是“磨洋工”？
Sonnet 4.6 的核心卖点是 **"Adaptive Thinking" (自适应思维)**。这听起来很智能，模型会根据任务难度决定想多久。
但在实际运行中，这变成了一种**不受控的 Token 膨胀**。

为了在 Benchmark 上多拿几分，模型在后台进行了大量的“内心戏”：
> *"我现在要解决这个问题... 让我先反思一下... 再验证一下... 好像不对，重来..."*

这一大堆废话，都是你看不见的 Token，但都是你要付的真金白银。引用官方自己的话，这叫 *"Agentic Planning"*；但在老派黑客眼里，这更像是 **帕金森定律** 在 AI 领域的应验：**只要你给模型足够的 Context Window，它就会用废话把它填满。**

### 3. 生态绑架 (Vendor Lock-in)
看看这次发布的配套动作：深度集成 Cline, Windsurf，甚至 Excel MCP。
他们在试图构建一个**围墙花园**。一旦你习惯了这种“昂贵但省心”的 Agent 体验，迁移成本将变得极高。你会被锁死在这个高成本的生态里，成为他们下一份财报的燃料。

## /dev/null (Zack's Take)

> “Anthropic 正在试图驯化我们，让我们接受**‘智能就是昂贵’**的设定。但这违背了黑客精神。好的技术应该是 **Do More With Less**。如果你的 Agent 需要消耗半个核电站才能帮我写一个 CRUD 接口，那你不是在创造未来，你是在挥霍未来。**Show me the efficiency, or shut up.**”
`;

async function update() {
  console.log('🚀 Updating Zack Article (v5.0 with Artificial Analysis)...');
  
  const { data, error } = await supabase
    .from('snapai_insights')
    .update({ 
      title: '效率的煤气灯效应：Anthropic 没告诉你的“隐形税”',
      excerpt: '官方宣称“性价比惊人”，但 Artificial Analysis 的实测数据显示：为了提升微小的智能，Token 消耗暴涨了 4.8 倍。',
      content_md: updatedContent,
      updated_at: new Date().toISOString()
    })
    .eq('slug', 'anthropic-claude-4-6-token-cost-analysis')
    .select()
    .single();

  if (error) {
    console.error('❌ Update failed:', error);
  } else {
    console.log(`✅ Updated successfully! Slug: ${data.slug}`);
  }
}

update();
