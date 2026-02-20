// scripts/update-brad-anthropic.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const updatedContent = `
# 被律师信逼出的独角兽：为什么 Anthropic 失去了 OpenClaw，而 OpenAI 赢得了这一战？

> **蝴蝶效应（Butterfly Effect）**：指在一个动态系统中，初始条件下微小的变化能带动整个系统长期且巨大的连锁反应，即“失之毫厘，谬以千里”。

Peter Steinberger 加入 OpenAI 的新闻第一时间就刷屏了。在众人惊呼差异的同时，也逐步披露了这背后的**黑色幽默**：Peter 本来是 Anthropic 的头号粉丝，就连 OpenClaw 的前身叫 **"ClawdBot"**，一听名字是专门为 Claude 打造的超级 agent。当然也可以理解成蹭 ClaudeCode 的热度，起码 Anthropic 是这么理解的 ；）。

那么，为什么这位 Agent 领域的“天选之子”，创造 GitHub star 数最快增长记录的大神，最终却投奔了 OpenAI？

原因有点儿荒谬：**Anthropic 给他发了一封律师函**。

敌人的敌人，就是朋友。我相信 Sam Altman 一定深谙此道。

## The Strategic Suicide (战略自杀)

### 1. 律师信 vs. 橄榄枝
根据 [VentureBeat 的深度报道](https://venturebeat.com/technology/openais-acquisition-of-openclaw-signals-the-beginning-of-the-end-of-the)，Anthropic 认为 "ClawdBot" 侵犯了商标权，威胁要起诉 Peter，并强制他改名、切断域名。
没想到一项以创新者、引领者自居的 Anthropic，也得了“**大公司病**”：比起繁荣的开发者生态，他们更在乎所谓的“品牌合规”。

结果我们都看到了，这个开源界最炙手可热的项目，开始了让大众（吃瓜群众）倍感疑惑的改名**三部曲**。ClawdBot 被迫先改名为 Moltbot，然后又在极短时间内改成了我们熟知的 OpenClaw。

我估计此时开始，Peter 就已经在心中埋下了“去 Claude 化”的种子，并开始接触 OpenAI？
马上，Sam Altman 就伸出了橄榄枝。OpenAI 不在乎名字，他们只在乎 **"Unhinged Energy" (疯狗般的创新精神)**。

### 2. OpenAI 的“无手之痛”与救赎
OpenAI 并非没有尝试过 Agent，或者说 OpenAI 迄今为止所有的 Agent 类尝试都不痛不痒：他们高调发布过 Agents API，搞过 Atlas 浏览器，但都没有得到市场的认可。

LangChain CEO Harrison Chase 则对此评论到：OpenAI 的官方产品太“安全”、太“正确”了。而 OpenClaw 之所以能火，是因为它给了用户 **Root 权限**，它允许模型在沙箱外狂奔。

OpenAI 应该很早就意识到了，他们内部注入一种**黑客基因**。他们买的不是代码，是 Peter 那种敢于打破规则的直觉。

当 Sam Altman 之前错过了 Manus 后，这一次不容有失。而且，我甚至觉得这次的收购要比 Manus 更加划算。

## The Paradigm Shift (范式转移)

### 3. 从 "Chat" 到 "Act"
Peter 在博客中说，他的目标是 **"Build an agent that even my mum can use"**。
这正是 OpenAI 最需要的。

ChatGPT 已经教会了全球用户如何“对话”，现在它需要教会用户如何“放手”。

当 OpenClaw 的架构（记忆、工具、规划）遇上 GPT-5 的智商，我们将迎来真正的 **Agent Native** 时代。这不再是关于谁的模型分更高，而是关于谁能帮你**把活干完**。

## >> FAST_FORWARD (Brad's Vision)

> “Anthropic 赢了官司，但输了战争。他们守住了商标，却把 Agent 时代的‘乔布斯’推向了对手。启示：**在技术爆炸的早期，生态的繁荣永远高于合规的洁癖。** 拥抱那些疯狂的开发者吧，因为他们手里握着通往未来的钥匙。”
`;

async function update() {
  console.log('🚀 Updating Brad Article (User Revised)...');
  
  const { data, error } = await supabase
    .from('snapai_insights')
    .update({ 
      title: '被律师信逼出的独角兽：为什么 Anthropic 失去了 OpenClaw，而 OpenAI 赢得了这一战？',
      content_md: updatedContent,
      updated_at: new Date().toISOString()
    })
    .eq('slug', 'how-anthropic-lost-openclaw-to-openai')
    .select()
    .single();

  if (error) {
    console.error('❌ Update failed:', error);
  } else {
    console.log(`✅ Updated successfully! Slug: ${data.slug}`);
  }
}

update();
