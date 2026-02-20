// scripts/publish-zack-recursive.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const articleData = {
  title: "4个月，40亿美金：硅谷最新的泡沫速度实验",
  slug: "recursive-intelligence-4b-valuation-bubble",
  excerpt: "一家成立仅 4 个月的芯片设计公司，估值飙升至 40 亿美元。这是对技术的定价，还是对流动性的恐慌？",
  content_md: `
# 4个月，40亿美金：硅谷最新的泡沫速度实验

在硅谷，时间是按秒计算的，但即便如此，**Recursive Intelligence** 的速度也让人感到眩晕。

这家由前 Google 研究员创立的初创公司，在成立仅仅 4 个月后，就完成了 [3.35 亿美元的融资，估值达到 40 亿美元](https://techcrunch.com/2026/02/16/how-ricursive-intelligence-raised-335m-at-a-4b-valuation-in-4-months/)。

你没看错。4 个月。40 亿。
也就是说，这家公司每一天的估值增长了 **3300 万美元**。这比绝大多数上市公司的营收还高。

## The Stack Trace (深度解析)

### 1. 人才的溢价还是资本的恐慌？(Talent Premium or Panic?)
Recursive 的创始人是 Anna Goldie 和 Azalia Mirhoseini，她们在 Google Brain 时期主导了利用强化学习 (RL) 进行芯片布局 (Floorplanning) 的研究，并发表在了《Nature》上。
技术确实是硬核的。用 AI 设计 AI 芯片，这是一个完美的闭环故事。

但 40 亿美金？
这说明 VC 们已经不仅是在投项目了，他们是在**抢船票**。在 GPU 产能被英伟达垄断的今天，任何声称能“用软件优化硬件”的团队，都被视为唯一的救命稻草。资本不在乎现在的产品（Product），只在乎未来的可能性（Optionality）。

### 2. 赌注的不对称性 (Asymmetric Bet)
对于领投的 Lightspeed 来说，这笔账算得很清楚：
*   如果 Recursive 失败了，他们损失 3 亿。
*   如果 Recursive 真的能让芯片设计效率提升 10 倍，打破英伟达的 CUDA 壁垒，那回报将是 1000 倍。

这是一场典型的**不对称赌博**。但在这种赌局里，普通开发者和创业者是上不了桌的。我们只能眼睁睁看着门槛被抬高到天际。

### 3. "Paperware" 到 "Silicon" 的鸿沟
从发表《Nature》论文到流片一颗 5nm 芯片，中间隔着一万个工程坑。
AI 可以优化布局，但 AI 不能解决散热，不能解决良率，不能解决台积电的排期。
40 亿估值的背后，是市场对 **"AI for Science"** 落地速度的极度乐观。但历史告诉我们，硬件迭代的物理周期 (Physics) 从来不会因为资本的意志而缩短。

## /dev/null (Zack's Take)

> “当一家公司还没卖出一颗芯片，估值就已经超过了 AMD 市值的十分之一，你就知道这杯咖啡里的泡沫比咖啡还多。但别误会，我尊重技术。如果 AI 真的能设计出比人类更好的芯片，那我们将迎来真正的奇点。只是在那之前，**请抓紧扶手，因为泡沫破裂时的响声会很大。**”
`,
  cover_image: "https://placehold.co/1200x630/000000/ef4444?text=4+MONTHS+4+BILLION&font=mono",
  tags: ['recursive-intelligence', 'venture-capital', 'ai-chips', 'bubble', 'silicon-valley'],
  related_journal_id: '146',
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
