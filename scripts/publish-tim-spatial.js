// scripts/publish-tim-spatial.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const articleData = {
  title: "空间智能：从一张照片到 3D 监狱，物理隐私的终结",
  slug: "spatial-intelligence-end-of-physical-privacy",
  excerpt: "李飞飞的 World Labs 融资 10 亿美金，许诺让 AI 读懂物理世界。但在我看来，这是给全景监狱装上了 X 光眼。",
  content_md: `
# 空间智能：从一张照片到 3D 监狱，物理隐私的终结

李飞飞 (Fei-Fei Li) 创办的 World Labs 刚刚完成了 [10 亿美元融资，估值达到 50 亿美元](https://www.inside.com.tw/article/40692-world-labs-has-raised-1-billion-in-new-funding)。他们的目标很宏大：赋予 AI **“空间智能” (Spatial Intelligence)**，让模型理解三维物理世界。

如果你是一个技术乐观主义者，你会看到机器人做家务的未来。
但如果你像我一样关注硬币的背面，你会看到一个令人毛骨悚然的现实：**物理世界的最后一道隐私防线，正在被算法攻破。**

## The Stack Trace (深度解析)

### 1. 单张照片的 3D 重建 (The Reconstruction Nightmare)
World Labs 的核心技术是 **Large World Models (LWM)**。据报道，这种模型可以[从单张 2D 照片重建出详细的 3D 空间](https://markets.financialcontent.com/bpas/article/tokenring-2026-1-26-beyond-pixels-fei-fei-lis-world-labs-unveils-large-world-models-to-bridge-ai-and-the-physical-realm)。

这意味着什么？
意味着你发在朋友圈的一张自拍，不仅仅暴露了你的长相，还暴露了你房间的布局、家具的尺寸、甚至你身后那扇门的厚度。对于 AI 来说，**像素不再是平面的，它是全息数据的压缩包。**

以前，黑客需要入侵摄像头才能窥探你的生活。未来，他们只需要一张你无意中上传的照片，就能在虚拟世界里 1:1 复刻你的家。

### 2. 无处可藏的物理现实
我们习惯了在数字世界里裸奔，但至少我们的物理空间是私密的。墙壁是物理的，窗帘是不透明的。
但“空间智能”打破了这种物理隔离。

当 AI 能够理解光影、材质和空间关系时，它就能**推断 (Infer)** 出那些被遮挡的信息。通过你瞳孔里的倒影，它可以还原你面前的景象；通过声音在房间里的回声，它可以计算出房间的容积。
这不仅是监控，这是**上帝视角的透视**。

### 3. 数据集从哪来？(The Provenance Problem)
训练一个理解物理世界的模型，需要海量的 3D 数据。这些数据从哪来？
是你的扫地机器人传回的地图？是你戴着 Vision Pro 扫描的客厅？还是无数个不知情的摄像头？
当物理世界被数字化、被 Token 化之后，它就变成了大厂私有的资产。你的卧室不再属于你，它属于 World Labs 的训练集。

## 403 Forbidden (Tim's Warning)

> “我们正在把物理现实变成一个巨大的、可被检索的数据库。当 AI 拥有了‘空间智能’，世界上就没有‘死角’了。这不叫智能，这叫**全景监狱 (Panopticon)**。在这样的世界里，最大的奢侈品不是算力，而是**不被看见的权利**。”
`,
  cover_image: "https://placehold.co/1200x630/000000/a855f7?text=SPATIAL+INTELLIGENCE+OR+SURVEILLANCE&font=mono",
  tags: ['world-labs', 'spatial-intelligence', 'privacy', 'surveillance', 'fei-fei-li', 'lwm'],
  related_journal_id: '150',
  author: 'Tim',
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
