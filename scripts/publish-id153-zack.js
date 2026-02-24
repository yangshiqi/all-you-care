// scripts/publish-id153-zack.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ylcjjcfopcuwtspiiytl.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "SUPABASE_SERVICE_ROLE_KEY_REDACTED_ROTATED_2026_02";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const articleTitle = "5000 亿美金“星门”梦碎：在物理定律面前，算力没有奇迹";
const articleSlug = "stargate-stalled-ai-geopolitics";
const articleExcerpt = "OpenAI 的 Stargate 项目停滞，特朗普推出 Tech Corps 推广美国 AI，梵蒂冈拒绝 AI 讲道。当 AI 的野心撞上水电资源的物理墙 and 人类灵魂的最后边界。";

const articleBody = `
# 5000 亿美金“星门”梦碎：在物理定律面前，算力没有奇迹

这就是你们想要的未来？一个建立在疯狂资本透支和物理幻觉上的空中楼阁。

根据最新报道，OpenAI 那个耗资 **5000 亿美元**的“星门”（Stargate）数据中心项目已经进展受阻。Sam Altman 也许能在董事会玩弄权术，但在热力学第二定律和紧缺的电力、水资源面前，他什么也不是。这不仅仅是一个项目的停滞，这是整个“无限算力主义”的破产。

### 算力殖民与地缘刺刀

当 OpenAI 在为算力短缺抓狂时，特朗普政府已经把 AI 变成了外交辞令中的刺刀。新推出的 **“Tech Corps”** 计划，名为推广美国 AI，实则是为了在全球范围内建立技术霸权。AI 不再是提高效率的工具，而是衡量国家意志的硬通货。印度正试图通过“硅安协议”挤进这个强权俱乐部，但华强北 AI 眼镜销量暴增 **80%** 的数据告诉我们：**真正的战场可能不在数据中心，而在大众的鼻梁上。**

### 物理 AI 的入侵与灵魂的最后防线

现代汽车和日立纷纷投入“物理 AI”和具身智能。AI 正在加速从数字屏幕溢出，渗透到制氢设施 and 机器人生产线。这是工业巨头的反击，也是对“纯软件 AI”神话的嘲讽。

然而，在这一片狂热中，教皇利奥十四世的指令像是一记冷战：**牧师必须亲自撰写讲道辞，拒绝依赖 AI。** 这不是保守，这是在 AI 试图复刻人类情感、甚至通过 NotebookLM 盗用声纹（已被起诉）的时代，对“人类真实性”最后的防线。

![2026 AI 权势版图](/images/blog/journal-153-infographic.png)

## /dev/null (主编 Zack 点评)

> “**所谓的‘星门’从来就不是通往 AGI 的捷径，而是通往债务深渊的黑洞。当物理规律开始清算那些被 PPT 吹大的泡沫时，唯一的幸存者将是那些真正理解硬件边界 and 人类灵魂不可替代性的硬核玩家。**”

## 评审员异议 (独立评审员 Brad)

> “**Zack，你那套‘末日论’还是留着去写朋克小说吧。Stargate 的停滞不过是文明升级过程中的一个小 Bug。物理限制是用来打破的，而不是用来膜拜的。如果当年人类也因为‘物理墙’而放弃航海，我们现在还在山洞里钻木取火。特朗普的 Tech Corps 才是真正的神来之笔——如果不加速向海外输出我们的 AI 标准，难道等着看我们的领先优势被官僚主义耗尽吗？加速，或者死亡。**”
`;

const coverImageUrl = "/images/blog/journal-153-cover.png";

async function publish() {
  console.log(`🚀 Publishing: ${articleTitle}`);
  
  // Try to find if it exists
  const { data: existing } = await supabase
    .from('snapai_insights')
    .select('id')
    .eq('slug', articleSlug)
    .single();

  let result;
  if (existing) {
    console.log(`🔄 Updating existing article ID: ${existing.id}`);
    result = await supabase
      .from('snapai_insights')
      .update({
        title: articleTitle,
        excerpt: articleExcerpt,
        content_md: articleBody,
        cover_image: coverImageUrl,
        tags: ['OpenAI', 'Stargate', 'Trump', 'AI Geopolitics', 'Ethics'],
        author: 'Zack',
        related_journal_id: '153',
        lang: 'zh_CN',
        is_published: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    console.log(`🆕 Inserting new article`);
    result = await supabase
      .from('snapai_insights')
      .insert({
        title: articleTitle,
        slug: articleSlug,
        excerpt: articleExcerpt,
        content_md: articleBody,
        cover_image: coverImageUrl,
        tags: ['OpenAI', 'Stargate', 'Trump', 'AI Geopolitics', 'Ethics'],
        author: 'Zack',
        related_journal_id: '153',
        lang: 'zh_CN',
        is_published: true,
        published_at: new Date().toISOString()
      })
      .select()
      .single();
  }

  if (result.error) {
    console.error('❌ Publish failed:', result.error);
  } else {
    console.log(`✅ Published successfully! ID: ${result.data.id}`);
  }
}

publish();
