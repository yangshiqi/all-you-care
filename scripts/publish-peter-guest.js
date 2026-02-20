// scripts/publish-peter-guest.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const articleData = {
  title: "Why I Joined: 当开源灵魂注入闭源心脏",
  slug: "why-i-joined-openai-openclaw-future",
  excerpt: "我已经玩过一次“打造独角兽”的游戏了。这次，我想玩点更大的：把 Agent 带给地球上的每一个人。",
  content_md: `
# Why I Joined: 当开源灵魂注入闭源心脏

很多人问我：Peter，你为什么要把 OpenClaw 交给基金会，自己跑去 OpenAI 打工？你本来可以把 OpenClaw 做成下一个 Red Hat。

Sam (Altman) 在 Twitter 上说我是“天才”，这很客气。但实话实说，我只是一个**不愿意忍受摩擦 (Friction)** 的工程师。

## The Builder's Dilemma (构建者的困境)

我在 PSPDFKit 花了 13 年时间。我学到了如何从零构建一家盈利的公司。那是一段很棒的旅程，但我不想再重复一次了。
做 CEO 意味着 80% 的时间在处理 HR、法务、融资和销售。只有 20% 的时间在写代码、在思考产品。

对于 OpenClaw，我的野心比“一家公司”大得多。
我想看到 Agent **无处不在**。我想看到你的手机、你的眼镜、你的汽车，都能理解你的意图并自主执行。

如果我自己开公司，我需要 5 年才能建立起分发渠道。
但在 OpenAI，我有机会在 **6 个月** 内，把这种体验推送到 **2 亿用户** 的指尖。

## The Linux and The iPhone (Linux 与 iPhone)

OpenClaw 现在的状态很好。它移交给了 **OpenClaw Foundation**。它将永远开源，永远中立，就像 Linux 一样。这是黑客们的乐园，是 Agent Native 架构的试验田。

而我去 OpenAI，是为了打造**“Agent 时代的 iPhone”**。
OpenAI 拥有最强的模型（Model），但他们缺乏某种... **操作系统层面的直觉 (OS Intuition)**。
这就是我能带来的东西。

OpenClaw 的核心理念——**原子化工具 (Atomic Tools)**、**反思循环 (Reflection Loops)**、**记忆管理 (Memory)**——这些不应该只是极客手中的脚本，它们应该成为 GPT 模型的本能。

## The Spark (火花)

想象一下：
*   **OpenClaw** 在外面探索边界，疯狂试错，像开源社区一样野蛮生长。
*   **OpenAI** 在内部吸收精华，打磨体验，将经过验证的 Agent 范式固化到模型权重里。

我不是去“打工”的。我是去**植入内核**的。
当开源的灵魂（Agent 架构）注入闭源的心脏（SOTA 模型），我们将不再讨论“哪个 App 更好用”，因为 App 这个概念本身，将被我们联手埋葬。

Let's ship.

---
*Peter Steinberger*
*Founder of OpenClaw, Member of Technical Staff at OpenAI*
`,
  cover_image: "https://placehold.co/1200x630/000000/10a37f?text=OPEN+SOURCE+SOUL+CLOSED+HEART&font=mono",
  tags: ['openai', 'openclaw', 'agent-native', 'career', 'open-source'],
  related_journal_id: '150',
  author: 'Peter Steinberger', // Guest Author
  lang: 'zh_CN',
  is_published: true,
  published_at: new Date().toISOString()
};

async function publish() {
  console.log(`🚀 Publishing Guest Article: ${articleData.title}`);
  
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
