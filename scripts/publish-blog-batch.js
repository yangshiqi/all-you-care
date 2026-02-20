// scripts/publish-blog-batch.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const blogs = [
  {
    title: '效率的煤气灯效应：Anthropic 没告诉你的“隐形税”',
    slug: 'the-gaslighting-of-efficiency-claude-4-6',
    excerpt: '官方说“性价比惊人”，社区说“Token 消耗翻倍”。谁在撒谎？工程的真相不容公关粉饰。',
    content_md: `
# 效率的煤气灯效应：Anthropic 没告诉你的“隐形税”

Anthropic 发布了 Claude 3.5 Sonnet 4.6，官方通稿里写满了 "Extraordinary performance-to-cost ratio"（惊人的性价比）和 "Do it all without increasing cost"（加量不加价）。

听起来很美，对吧？

但如果你去看看独立开发者的实测数据，或者读一读那些没有被公关稿淹没的 Substack 评测，你会发现一个可怕的事实：**Token 消耗量剧增 4.8 倍**。

## The Stack Trace (深度解析)

### 1. 重新定义“性价比” (Redefining Value)
Anthropic 在玩一个文字游戏。他们说的“不增加成本”，是指**单价 ($/M Token)** 没变。
但如果完成同一个任务需要消耗 5 倍的 Token，你的实际账单就是涨了 5 倍。

这就好比一家餐厅宣称“米饭单价没涨”，但悄悄把你的碗换成了脸盆，并且强制你必须吃完才能走。这不是性价比，这是**抢劫**。

### 2. Benchmark Gaming (刷榜工程)
SWE-Bench 79.6% 的高分是怎么来的？
很有可能是在模型内部塞入了大量的 "Chain of Thought" (思维链) 或者 "Self-Reflection" (自我反思) 步骤。模型在后台默默地自言自语了成千上万字，这些都是你看不见的 Token，但都是你要付的钱。

这也是为什么它在 **Computer Use** 上表现更好——因为它在疯狂地尝试、报错、重试。这在 Demo 里很酷，但在生产环境里，这就是**资源黑洞**。

### 3. 生态绑架 (Vendor Lock-in)
看看这次的发布：深度集成 Cline, Windsurf，甚至 Excel MCP。
他们在构建一个**围墙花园**。一旦你习惯了这种“昂贵但省心”的 Agent 体验，你就再也回不去了。你会被锁死在这个高成本的生态里，成为他们下一份财报的燃料。

## /dev/null (Zack's Take)

> “Anthropic 正在试图让我们相信：为了智能，付出任何代价都是值得的。但这违背了工程学的基本原理。**好的技术应该是更少资源做更多事，而不是更多资源做同样的事。** 如果你的模型需要消耗半个核电站才能帮我写一个 \`Hello World\`，那你不是在创造未来，你是在挥霍未来。”
`,
    tags: ['anthropic', 'gaslighting', 'cost', 'engineering', 'benchmark-gaming'],
    author: 'Zack',
    related_journal_id: '149'
  },
  {
    title: '伟大的过滤器：为什么 80% 的 App 注定成为历史尘埃？',
    slug: 'the-great-filter-why-80-percent-apps-will-die',
    excerpt: 'OpenClaw 创始人说了真话：如果你只是数据的搬运工，AI 会取代你。留给中间商的时间不多了。',
    content_md: `
# 伟大的过滤器：为什么 80% 的 App 注定成为历史尘埃？

OpenClaw 创始人斯坦伯格 (Steinberg) 刚刚在采访中撕开了移动互联网的遮羞布：**“未来 80% 的 APP 将会消失。”**

这不是危言耸听，这是**进化的必然**。

## The Acceleration (趋势加速)

### 1. 中间商的黄昏 (The End of Middlemen)
斯坦伯格提出了一个极其精准的“死刑标准”：**“若一款 APP 的核心功能能用一句话概括，便大概率会被 AI 替代。”**

汇率计算？天气预报？订闹钟？甚至打车、点外卖？
这些 App 本质上只是**意图 (Intent) 到 数据库 (Database)** 之间的 GUI 中介。以前我们需要这个中介，因为机器听不懂人话。
现在，LLM 听得懂了。Agent 可以直接连接 API。**中介必须死。**

### 2. 幸存者名单 (The Survivor List)
斯坦伯格也很清醒地列出了那 20% 的幸存者：
*   **Figma/Photoshop**：需要人类的精细创造力。
*   **TikTok/Genshin**：提供沉浸式的情绪价值。
*   **Medical/Legal**：即使 AI 能做，法律也不允许它背锅。

这告诉我们什么？未来的护城河只有两条：**极致的工具属性** 或 **极致的体验属性**。其他的“效率工具”，都将被 Agent 吞噬。

### 3. Agent Native 的黎明
这是一场**大灭绝**，也是一场**寒武纪大爆发**。
旧的 App 生态正在崩塌，但一个新的 **Agent Native** 生态正在崛起。未来的创业者不再是写 iOS App，而是写 **MCP Server**，写 **Tools**，写让 AI 调用的 API。

## >> FAST_FORWARD (Brad's Vision)

> “不要哀悼旧时代的逝去。每一个消失的 App，都意味着人类少了一次无意义的点击，多了一秒钟自由的时间。我们正在从‘操作屏幕’进化到‘编排意图’。如果你是开发者，别再造轮子了，开始造引擎吧！**让你的服务成为 Agent 的手和眼，而不是人类的手指监狱。**”
`,
    tags: ['paradigm-shift', 'agent-native', 'openclaw', 'app-economy', 'future'],
    author: 'Brad',
    related_journal_id: '149'
  }
];

async function publishBatch() {
  console.log('🚀 Publishing Blog Batch...');

  for (const blog of blogs) {
    const { data, error } = await supabase
      .from('snapai_insights')
      .upsert({
        ...blog,
        lang: 'zh_CN',
        is_published: true,
        published_at: new Date().toISOString()
      }, { onConflict: 'slug' })
      .select();

    if (error) {
      console.error(`❌ Error publishing ${blog.slug}:`, error);
    } else {
      console.log(`✅ Published: ${data[0].title} (Author: ${data[0].author})`);
    }
  }
}

publishBatch();
