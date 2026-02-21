// scripts/publish-id151-zack.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const articleData = {
  title: "算力央行：万亿估值背后的“门票”战争",
  slug: "openai-zhipu-valuation-capital-war",
  excerpt: "全球 AI 估值体系崩坏。OpenAI 冲刺 8500 亿美元，智谱、MiniMax 杀入 3000 亿港元俱乐部。这不再是技术竞赛，而是资本主权的终极收割。",
  content_md: `
# 算力央行：万亿估值背后的“门票”战争

> “当智能成为公用事业，资本就不再是燃料，而是围墙。” —— Zack

### 1. 信号：从“独角兽”到“准主权级”的跃迁
本周，全球 AI 市场的估值体系彻底崩坏。

在西方，[OpenAI 拟完成千亿融资](https://techcrunch.com/2026/02/19/openai-reportedly-finalizing-100b-deal-at-more-than-850b-valuation/)，投后估值直指 **8500 亿美元**。紧随其后的 Anthropic 以 3800 亿美元估值吸纳 300 亿。而在东方，港股的“大模型双雄”——**智谱 AI (Zhipu)** 和 **MiniMax** 刚复市就狂飙，市值双双站稳 **3000 亿港元俱乐部**。

这已经不是什么“初创公司增长”的故事了。这是**算力资本的主权化**。

### 2. 深度拆解：为什么资本在疯狂“囤积”基座模型？

#### 2.1 坎蒂隆效应与“智能印钞机” (The Intelligent Mint)
在经济学中，**坎蒂隆效应 (Cantillon Effect)** 指出：谁离印钞机最近，谁就获利最大。

OpenAI、Anthropic，以及国内的智谱、MiniMax，正在成为数字世界的**“智能央行”**。亚马逊、软银、英伟达之所以疯狂注资，不是为了财务回报，而是为了获得“配额”。当未来的每一个 CRUD 接口、每一行自动生成的代码都必须经过这些大模型的“准许”时，拥有这些模型的股权，就等于拥有了数字世界的**征税权**。

#### 2.2 稀缺性溢价：万亿级别的“入场券”
智谱和 MiniMax 在港股的狂飙，反映了二级市场的一种极端恐慌：**害怕错过最后的基座门票**。港股市场的“大模型双雄”作为稀缺标的，已经成为了全球资金配置的刚需。

全球范围内的 AI 基础设施建设已进入“国家级”规模。印度信实工业（Reliance）砸下的 **1100 亿美元** AI 蓝图不是在造软件，是在造“算力主权”。在这种背景下，能活下来的基座模型不再是“产品”，而是“稀缺的全球资源”。

### 3. 战略陷阱：被定价驱逐的黑客精神
这种“万亿俱乐部”游戏的残酷真相是：**入场费被无限抬高**。

以前，几个黑客在车库里能做出颠覆性的软件；现在，你光买显卡、交 Token 费就能让一个 A 轮团队直接破产。当资本从“购买人力”转向“购买算力”（正如 Andrew Yang 所预警的），AI 的护城河就不再是算法的灵巧，而是资本的厚度。

### 4. /dev/null (Zack's Take)

> “现在的 AI 行业越来越像 19 世纪的石油战争。OpenAI 和智谱这些公司正在修建输油管道，而我们这些开发者只是管道末端的消费者。不要被股市大涨的狂欢蒙蔽，我们要警惕这种**‘算力资本的康采恩化’**。如果智能的源头被几家万亿巨头垄断，那么所谓的‘开源’和‘黑客精神’将沦为巨头后花园里的盆景。**Show me the decentralization, or it's just another tax.**”🤖🤘
`,
  cover_image: "https://placehold.co/1200x630/000000/ffcc00?text=THE+COMPUTE+MINT:+Capital+War&font=mono",
  tags: ['openai', 'zhipu-ai', 'minimax', 'valuation', 'capital-war', 'zack'],
  related_journal_id: '151',
  author: 'Zack',
  lang: 'zh_CN',
  is_published: true,
  published_at: new Date().toISOString()
};

async function publish() {
  const { data, error } = await supabase
    .from('snapai_insights')
    .insert(articleData)
    .select()
    .single();

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log(`✅ Success! Slug: ${data.slug}`);
  }
}

publish();
