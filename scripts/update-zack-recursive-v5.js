// scripts/update-zack-recursive-v5.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const updatedContent = `
# 4个月，40亿美金：建立在“学术造假”指控上的独角兽？

> **皇帝的新衣 (The Emperor's New Clothes)**：当所有人都在为一件看不见的衣服喝彩时，只有一个孩子敢说实话。在硅谷，这个孩子通常会被开除。

Recursive Intelligence，这家由前 Google 研究员创立的初创公司，刚刚以 40 亿美元估值完成了融资。
VC 们之所以疯狂，是因为这两位创始人（Anna Goldie 和 Azalia Mirhoseini）是 Google **AlphaChip** 项目的功臣。她们在《Nature》上发表论文，声称 AI 设计芯片的能力超越了人类。

这是一个完美的故事。除了一点：**这个故事的真实性，正在法庭上接受审判。**

## The Stack Trace (深度解析)

### 1. 被开除的吹哨人 (The Whistleblower)
你可能没听说过 **Satrajit Chatterjee**。他也是 Google 的研究员。
当 AlphaChip 的论文发表后，Chatterjee 试图在内部发表一篇反驳论文。他指控 AlphaChip 的实验对比不公平，所谓“超越人类”的结果涉及**“欺诈和学术不端” (Fraud and Scientific Misconduct)**。

Google 的反应是什么？
他们没有公开辩论，而是**拒绝发表**他的论文，并直接**开除**了他。
Chatterjee 随后提起了[不当解雇诉讼](https://en.wikipedia.org/wiki/AlphaChip_(controversy))。这场官司撕开了 Google AI 研究的一角：为了维护 SOTA 的神话，异见者必须被消声。

### 2. 无法复现的魔法 (Irreproducible Magic)
学术界（如 UCSD 的 Andrew Kahng 教授）早就对 AlphaChip 提出了[质疑](https://news.ycombinator.com/item?id=41673769)：
*   **代码缺失**：关键的模拟退火代码没有开源。
*   **数据黑箱**：没有 Google 内部的 TPU 数据，结果无法复现。
*   **稻草人攻击**：它对比的“人类基准”可能被故意调低了。

现在，Recursive Intelligence 带着这个“有污点”的光环，融资 40 亿美金。VC 们是在投技术，还是在投一个**被精心包装的学术营销案**？

### 3. 硅谷的豪赌
Lightspeed 和其他 VC 并非不知道这些争议。但在这个 GPU 短缺的年代，他们不在乎。
只要有一个故事能讲得通“打破英伟达垄断”，钱就会涌进来。
Recursive 是硅谷焦虑的具象化。他们宁愿把钱投给一个可能是骗局的项目，也不愿错过下一个 DeepMind。

## /dev/null (Zack's Take)

> “当 40 亿美金的估值建立在一个**连前同事都实名举报**的算法之上时，你就知道现在的泡沫有多大了。Recursive 最好能拿出点真东西来，否则这就不是下一个 NVIDIA，而是下一个 **Theranos**。记住：代码不会撒谎，但写代码的人会。”
`;

async function update() {
  console.log('🚀 Updating Recursive Article (v5.0 with Controversy)...');
  
  const { data, error } = await supabase
    .from('snapai_insights')
    .update({ 
      title: '4个月，40亿美金：建立在“学术造假”指控上的独角兽？',
      excerpt: 'Recursive Intelligence 的核心资产是 AlphaChip。但你可能不知道，Google 为了保护这个“神话”，开除了一位试图揭露真相的吹哨人。',
      content_md: updatedContent,
      updated_at: new Date().toISOString()
    })
    .eq('slug', 'recursive-intelligence-4b-valuation-bubble')
    .select()
    .single();

  if (error) {
    console.error('❌ Update failed:', error);
  } else {
    console.log(`✅ Updated successfully! Slug: ${data.slug}`);
  }
}

update();
