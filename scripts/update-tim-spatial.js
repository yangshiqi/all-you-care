// scripts/update-tim-spatial.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const updatedContent = `
# 空间智能：当现实世界变成“楚门的世界”

> **全景监狱 (Panopticon)**：边沁在 18 世纪构想的一种监狱设计。囚犯不知道自己是否被监视，因此必须时刻假设自己正在被监视。

李飞飞 (Fei-Fei Li) 的新公司 World Labs 刚刚完成了 [10 亿美元的融资，估值 50 亿美元](https://www.inside.com.tw/article/40692-world-labs-has-raised-1-billion-in-new-funding)。投资名单里站着 a16z 和 Nvidia 这样的巨头。

他们的愿景很性感：**“空间智能” (Spatial Intelligence)**。让 AI 像人类一样理解三维空间，从而指挥机器人倒咖啡、叠被子。

但在欢呼声中，我感到一丝寒意。我们正在拆除物理世界保护隐私的最后一道墙：**不透明性 (Opacity)**。

## The Stack Trace (深度解析)

### 1. 从“街景”到“卧室” (Street View to Bedroom View)
回想一下 Google Street View 刚推出时的恐慌。那时我们担心的只是“路人被拍到”。
World Labs 的 **Large World Models (LWM)** 正在做的事，是把这种扫描推进到你的客厅、你的卧室、你的卫生间。

据报道，他们的技术可以[从单张 2D 照片重建出详细的 3D 空间](https://markets.financialcontent.com/bpas/article/tokenring-2026-1-26-beyond-pixels-fei-fei-lis-world-labs-unveils-large-world-models-to-bridge-ai-and-the-physical-realm)。
这意味着，你无意中发在 Instagram 上的一张自拍，可能会暴露出你身后书架上的书名、桌上文件的厚度，甚至通过镜面反射还原出你并没有拍摄到的房间死角。
**像素不再是平面的，它是全息数据的压缩包。**

### 2. 物理现实的“数字化殖民”
Apple Vision Pro 提出了“空间计算”，想要把数字内容叠加在现实之上。
World Labs 则相反，它想把**现实世界吞噬进数字模型里**。

当物理空间被完全参数化 (Parameterized) 后，它就变成了大公司服务器上的一条数据记录。
这意味着什么？这意味着你的家不再是你的私有领地，它变成了 AI 训练集的一部分。如果有朝一日，保险公司通过 AI 扫描你的房间发现你有“不健康的生活方式”而拒赔，你该找谁说理？

### 3. 上帝视角的透视 (The God View)
最可怕的不是“看见”，而是“推断”。
当 AI 拥有了物理常识，它就能通过光影、声音回声、材质纹理，去**脑补**出那些被遮挡的信息。
这就像是给了算法一副 X 光眼镜。墙壁不再是阻隔，窗帘不再是屏障。
在这个“空间智能”编织的网里，我们每个人都将生活在一个透明的玻璃房子里，就像《楚门的世界》。

## 403 Forbidden (Tim's Warning)

> “我们正在为了‘让机器人帮我洗碗’这点便利，通过出卖我们作为生物最后的尊严——**藏身之处**。当物理世界变成了可被检索的数据库，隐私就不再是一项权利，而是一种需要付费购买的奢侈品。**Welcome to the Glass World.**”
`;

async function update() {
  console.log('🚀 Updating Tim Article (v4.0)...');
  
  const { data, error } = await supabase
    .from('snapai_insights')
    .update({ 
      title: '空间智能：当现实世界变成“楚门的世界”',
      content_md: updatedContent,
      updated_at: new Date().toISOString()
    })
    .eq('slug', 'spatial-intelligence-end-of-physical-privacy')
    .select()
    .single();

  if (error) {
    console.error('❌ Update failed:', error);
  } else {
    console.log(`✅ Updated successfully! Slug: ${data.slug}`);
  }
}

update();
