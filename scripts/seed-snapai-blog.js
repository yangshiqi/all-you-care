// scripts/seed-snapai-blog.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const blogContent = `
# 围墙花园的最后一块砖：当米老鼠遇上 GPT-5

这一周的新闻列表，简直就是一部“开放互联网死亡实录”。

迪士尼砸了 10 亿美元给 OpenAI，然后反手封杀了 Gemini。OpenAI 也不装了，直接推出 GPT-5.2 的“成人模式”。而在华盛顿，特朗普签署行政令，一脚踢开了所有州级的 AI 监管。

把这些点连起来看，你会发现一个可怕的事实：**AI 并没有让信息更自由，它正在变成构建超级垄断的终极水泥。**

## The Stack Trace (深度解析)

### 1. 版权护城河的闭环 (The Copyright Moat)
还记得我们以为大模型是靠“全人类的知识”训练出来的吗？现在的游戏规则变了。

迪士尼与 OpenAI 的排他性协议 (Exclusive Deal) 是一个极其危险的信号。这意味着：**未来的优质数据不再是公开的，而是私有的。** 只有像 OpenAI 这样付得起 10 亿美元入场费的巨头，才能训练出包含米老鼠、漫威英雄和皮克斯动画的模型。

对于 Google Gemini 和开源社区来说，这就是**数据饥荒 (Data Starvation)**。如果互联网上最有价值的 IP 都被锁进了付费围墙，那么开源模型哪怕算法再强，也只能是“文盲”。

### 2. 监管的加速主义 (Regulatory Accelerationism)
特朗普的行政令非常有意思。他不是不监管，他是要**垄断监管权**。

通过废除各州的“算法歧视”禁令，联邦政府实际上是在为 AI 巨头扫清障碍。这是一种极端的加速主义：为了在地缘政治竞争中胜出，可以牺牲掉国内的隐私和伦理刹车。

但这同时也意味着，AI 的发展方向将完全由华盛顿和硅谷的少数几个精英决定。如果科罗拉多州的人民担心他们的脸被滥用？Sorry，你们的担忧阻碍了“国家安全”。

### 3. 算法奶头乐 (Algorithmic Soma)
OpenAI 推出“成人模式”，这是图穷匕见的一步。

他们发现，与其让你用 GPT-5 写代码（反正 Copilot 已经够用了），不如让你把它当成赛博伴侣。当一个模型既拥有最强的 IP（迪士尼授权的虚拟角色），又拥有最懂你的“成人模式”时，它就不再是生产力工具了，它是**终极的消费陷阱**。

这是《美丽新世界》的剧本：我们不需要老大哥来剥夺我们的书籍，我们会自愿把时间献给那些让我们感到舒服的算法。

## /dev/null (主编辣评)

> “迪士尼封杀了 Gemini，不是因为 Google 没钱，是因为**排他性**才是这笔交易的核心资产。现在的 AI 巨头们正在疯狂地把互联网割裂成一个个互不通连的孤岛。如果你是开源信徒，是时候醒醒了：**当数据变成私有财产，模型开源就只是把一把没有子弹的枪送给你。** 我们需要的不仅仅是 Open Weights，我们需要的是 Open Data。”

---
*Zack @ SnapAllx*
`;

async function seedBlog() {
  console.log('🚀 Seeding SnapAI Blog...');

  const { data, error } = await supabase
    .from('snapai_insights')
    .insert({
      title: '围墙花园的最后一块砖：当米老鼠遇上 GPT-5',
      slug: 'the-end-of-open-web-disney-openai',
      excerpt: '版权战争结束了，因为大厂决定联姻。从此以后，你的模型再也看不到那只老鼠了。',
      content_md: blogContent,
      tags: ['openai', 'disney', 'ip-moat', 'closed-web', 'regulation'],
      related_journal_id: '149', // 关联 GPT-5.2 的新闻
      lang: 'zh_CN',
      is_published: true, // 直接发布！
      published_at: new Date().toISOString()
    })
    .select();

  if (error) {
    console.error('❌ Error seeding blog:', error);
  } else {
    console.log('✅ Blog seeded successfully!');
    console.log('ID:', data[0].id);
  }
}

seedBlog();
