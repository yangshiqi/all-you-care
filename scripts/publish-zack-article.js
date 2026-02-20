// scripts/publish-zack-article.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. Article Content (Zack Persona)
const articleTitle = "效率的煤气灯效应：Anthropic 没告诉你的“隐形税”";
const articleSlug = "efficiency-gaslighting-claude-4-6-hidden-tax";
const articleExcerpt = "官方通稿说“加量不加价”，开发者的账单却翻了 5 倍。这是一场关于定义的魔术，也是软件工程的倒退。";

const articleBody = `
# 效率的煤气灯效应：Anthropic 没告诉你的“隐形税”

Anthropic 发布了 Claude 3.5 Sonnet 4.6。官方博客里写满了 *"Extraordinary performance-to-cost ratio"*（惊人的性价比）和 *"Do it all without increasing cost"*（加量不加价）。

听起来很美，是吧？

但如果你去看看独立开发者的实测数据，或者读一读那些没有被公关稿淹没的真实反馈，你会发现一个可怕的事实：**Token 消耗量剧增 4.8 倍**。

## The Stack Trace (深度解析)

### 1. 重新定义“性价比” (Redefining Value)
Anthropic 在玩一个文字游戏，堪称**煤气灯效应 (Gaslighting)** 的典范。

他们说的“不增加成本”，是指 **每百万 Token 的单价 ($3 Input / $15 Output)** 没变。
但是，如果完成同一个 \`fix_bug()\` 任务，以前需要 1k Token，现在模型在后台“自言自语”了 5k Token 才给你结果，你的实际账单就是**涨了 500%**。

这就好比加油站宣称“油价没涨”，但悄悄把你车子的油耗改成了百公里 50 个油。这不是技术进步，这是**抢劫**。

### 2. 刷榜工程的代价 (Benchmark Gaming)
SWE-Bench **79.6%** 的高分是怎么来的？
现在的 SOTA 模型越来越像是一个**“为了考试而生”**的怪胎。为了在 Benchmark 上多拿几分，模型内部可能被强制塞入了大量的 **Chain of Thought (CoT)**、**Self-Reflection (自我反思)** 和 **Rejection Sampling (拒绝采样)**。

这意味着，当你问它 *"1+1=?"* 时，它可能在后台进行了如下思考：
> *"我现在要计算 1+1。首先定义什么是 1。然后定义加法。考虑到皮亚诺公理... 让我反思一下有没有遗漏... 好的，结果是 2。"*

这一大堆废话，都是你看不见的 Token，但都是你要付的真金白银。

### 3. Bloatware 2.0 (新时代的臃肿软件)
在传统软件工程里，如果一个新版本的库为了提升 10% 的性能，却多吃了 500% 的内存，我们会叫它什么？**Bloatware (臃肿垃圾)**。我们会立刻回滚代码。

但在 AI 界，这被称为 **Agentic**。
这是一种极其危险的趋势：**用指数级的资源消耗，去换取线性的智能增长。** 摩尔定律带来的硬件红利（英伟达降的价），全被模型厂商用低效的架构（Anthropic 涨的量）给吃回去了。

## /dev/null (Zack's Take)

> “Anthropic 正在试图驯化我们，让我们接受**‘智能就是昂贵’**的设定。但这违背了黑客精神。好的技术应该是 **Do More With Less**。如果你的 Agent 需要消耗半个核电站才能帮我写一个 CRUD 接口，那你不是在创造未来，你是在挥霍未来。**Show me the efficiency, or shut up.**”

---
*Zack @ SnapAllx*
`;

// 2. Cover Image (Simulated Generation)
// 这是一个符合 Tech-Noir 风格的占位图 URL，实际生产中应替换为 AI 生成的图片链接
// 使用深色背景 (#09090b) + 绿色终端字体 (#22c55e)
const coverImagePrompt = "Minimalist tech noir style, dark background, neon green glitch text saying 'HIDDEN TAX', coding terminal aesthetic";
const coverImageUrl = "https://placehold.co/1200x630/09090b/22c55e?text=HIDDEN+TAX%3A+The+Cost+of+Intelligence&font=roboto";

async function publish() {
  console.log(`🚀 Publishing: ${articleTitle}`);
  console.log(`🎨 Cover Image: ${coverImageUrl}`);

  const { data, error } = await supabase
    .from('snapai_insights')
    .upsert({
      title: articleTitle,
      slug: articleSlug,
      excerpt: articleExcerpt,
      content_md: articleBody,
      cover_image: coverImageUrl,
      tags: ['anthropic', 'cost', 'efficiency', 'gaslighting', 'engineering'],
      author: 'Zack',
      related_journal_id: '149',
      lang: 'zh_CN',
      is_published: true,
      published_at: new Date().toISOString()
    }, { onConflict: 'slug' })
    .select()
    .single();

  if (error) {
    console.error('❌ Publish failed:', error);
  } else {
    console.log(`✅ Published successfully! ID: ${data.id}`);
  }
}

publish();
