// scripts/update-brad-app-death.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const updatedContent = `
# 伟大的过滤器：为什么 80% 的 App 注定成为历史尘埃？

> **大灭绝 (Mass Extinction)**：在地质历史上，每一次旧物种的大规模消亡，都预示着一种更高级、更适应环境的新生命形式即将接管地球。

OpenClaw 创始人 Steinberg 刚刚在采访中抛出了一个激进的预测：**“未来 80% 的 APP 将会消失。”**

在硅谷的咖啡馆里，很多人把这当成危言耸听。但在我看来，这是对**数字生物进化论**最精准的预判。我们正在经历软件行业的“白垩纪末期”。

## The Acceleration (趋势加速)

### 1. 交互的降维打击 (The Interaction Collapse)
现在的 App 是什么？本质上是 **GUI 迷宫**。
为了订一张机票，你需要：打开 App -> 点击搜索 -> 选择日期 -> 筛选航班 -> 填写信息 -> 支付。每一步都是摩擦。

AI Agent 带来的不是“更好的搜索”，而是**交互的折叠**。
当你告诉 Agent "下周五去东京，定靠窗位置" 时，那 10 个步骤的 GUI 操作瞬间被压缩成了一个 **Intent (意图)**。
OpenAI 的 **Operator** 和 Google 的 **Jarvis** 已经证明了这一点：当机器能看懂屏幕时，专门为人眼设计的 GUI 就成了累赘。

### 2. 中间商的黄昏
Steinberg 给出了一个残酷的“死刑标准”：**“若一款 APP 的核心功能能用一句话概括，便大概率会被 AI 替代。”**

*   汇率转换？死。
*   天气预报？死。
*   比价工具？死。

这些 App 本质上是 **API 的二道贩子**。以前我们需要它们，因为大模型还没出现，我们需要一个界面来“翻译”数据。现在，Agent 直接连接 API，中间商赚差价的时代结束了。

### 3. 幸存者与新物种
当然，Steinberg 也列出了那 20% 的幸存者名单：**Figma (创造力)**、**TikTok (多巴胺)**、**Medical (责任)**。
这告诉我们，未来的护城河只有两条：**极致的工具属性**（Agent 做不到）或 **极致的体验属性**（Agent 没感觉）。

但这不仅是毁灭，更是**新生**。
旧的 App 生态正在瓦解，但一个新的 **Agent Native** 生态正在崛起。未来的创业者，不再是写 iOS App 给人用，而是写 **MCP Server** 给 AI 用。我们正在从“构建界面”转向“构建能力”。

## >> FAST_FORWARD (Brad's Vision)

> “不要哀悼旧时代的逝去。每一个消失的 App，都意味着人类少了一次无意义的点击，多了一秒钟自由的时间。这是一场伟大的过滤器，它过滤掉的是**低效的摩擦**，留下的是**纯粹的意图**。如果你是开发者，别再造轮子了，开始造引擎吧！Let's Build the Agency!”
`;

async function update() {
  console.log('🚀 Updating Brad Article (v4.0)...');
  
  const { data, error } = await supabase
    .from('snapai_insights')
    .update({ 
      title: '伟大的过滤器：为什么 80% 的 App 注定成为历史尘埃？',
      content_md: updatedContent,
      updated_at: new Date().toISOString()
    })
    .eq('slug', 'the-great-filter-why-80-percent-apps-will-die')
    .select()
    .single();

  if (error) {
    console.error('❌ Update failed:', error);
  } else {
    console.log(`✅ Updated successfully! Slug: ${data.slug}`);
  }
}

update();
