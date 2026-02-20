// scripts/publish-brad-anthropic-fail.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const articleData = {
  title: "被律师信逼出的独角兽：为什么 Anthropic 失去了 OpenClaw，而 OpenAI 赢得了未来？",
  slug: "how-anthropic-lost-openclaw-to-openai", // 使用新的 slug 覆盖之前的 Brad 文章（或者新发一篇）
  // 考虑到之前已经发过一篇 Brad 的，我们可以选择覆盖（如果想替换观点），或者发新的。
  // 用户的意思是“重新分析”，所以我倾向于使用新的 slug 或者覆盖旧的。
  // 这里使用新的 slug 更加安全，避免前端缓存问题。
  excerpt: "这是一个关于“傲慢与偏见”的硅谷故事。Anthropic 用法律大棒赶走了一位天才，而 OpenAI 用开放怀抱赢得了 Agent 时代的入场券。",
  content_md: `
# 被律师信逼出的独角兽：为什么 Anthropic 失去了 OpenClaw，而 OpenAI 赢得了未来？

历史总是由微小的蝴蝶翅膀扇动而起。

Peter Steinberger 加入 OpenAI 的新闻刷屏了。但很少有人知道这背后的**黑色幽默**：Peter 本来是 Anthropic 的头号粉丝。OpenClaw 的前身叫 **"ClawdBot"**，它是专门为 Claude 打造的。

那么，为什么这位 Agent 领域的“天选之子”最终却投奔了 OpenAI？
答案令人咋舌：**因为 Anthropic 给他发了一封律师函。**

## The Strategic Suicide (战略自杀)

### 1. 律师信 vs. 橄榄枝
根据 [VentureBeat 的深度报道](https://venturebeat.com/technology/openais-acquisition-of-openclaw-signals-the-beginning-of-the-end-of-the)，Anthropic 认为 "ClawdBot" 侵犯了商标权，威胁要起诉 Peter，并强制他改名、切断域名。
这是一种典型的**“大公司病”**：比起繁荣的开发者生态，他们更在乎所谓的“品牌合规”。

结果呢？Peter 被迫改名 OpenClaw，并在心中埋下了“去 Claude 化”的种子。
随后，Sam Altman 伸出了橄榄枝。OpenAI 不在乎名字，他们只在乎 **"Unhinged Energy" (疯狗般的创新精神)**。

### 2. OpenAI 的“无手之痛”与救赎
OpenAI 并非没有尝试过 Agent。他们发布过 Agents API，搞过 Atlas 浏览器，但都**失败了**。
LangChain CEO Harrison Chase 一语道破天机：OpenAI 的官方产品太“安全”、太“正确”了。而 OpenClaw 之所以能火，是因为它给了用户 **Root 权限**，它允许模型在沙箱外狂奔。

OpenAI 意识到，他们需要在内部注入这种**黑客基因**。他们买的不是代码，是 Peter 那种敢于打破规则的直觉。

## The Paradigm Shift (范式转移)

### 3. 从 "Chat" 到 "Act"
Peter 在博客中说，他的目标是 **"Build an agent that even my mum can use"**。
这正是 OpenAI 最需要的。ChatGPT 已经教会了全球用户如何“对话”，现在它需要教会用户如何“放手”。

当 OpenClaw 的架构（记忆、工具、规划）遇上 GPT-5 的智商，我们将迎来真正的 **Agent Native** 时代。这不再是关于谁的模型分更高，而是关于谁能帮你**把活干完**。

## >> FAST_FORWARD (Brad's Vision)

> “Anthropic 赢了官司，但输了战争。他们守住了商标，却把 Agent 时代的‘乔布斯’推向了对手。这个故事告诉我们：**在技术爆炸的早期，生态的繁荣永远高于合规的洁癖。** 拥抱那些疯狂的开发者吧，因为他们手里握着通往未来的钥匙。”
`,
  cover_image: "https://placehold.co/1200x630/000000/eab308?text=LAWYERS+VS+BUILDERS&font=mono",
  tags: ['openclaw', 'openai', 'anthropic', 'strategy', 'peter-steinberger', 'agent-wars'],
  related_journal_id: '150',
  author: 'Brad',
  lang: 'zh_CN',
  is_published: true,
  published_at: new Date().toISOString()
};

async function publish() {
  console.log(`🚀 Publishing Deep Dive Article: ${articleData.title}`);
  
  // 先尝试删除旧的 Brad 文章 (为了保持 Blog 列表干净，避免重复话题)
  // 旧 slug: openclaw-joins-openai-agent-iphone-moment
  await supabase.from('snapai_insights').delete().eq('slug', 'openclaw-joins-openai-agent-iphone-moment');

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
