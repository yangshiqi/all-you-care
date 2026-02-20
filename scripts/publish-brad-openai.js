// scripts/publish-brad-openai.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const articleData = {
  title: "当 OpenClaw 走进 OpenAI：Agent 时代的 iPhone 时刻",
  slug: "openclaw-joins-openai-agent-iphone-moment",
  excerpt: "开源的 Agent 架构之父，加入了闭源的模型巨头。这不是“招安”，这是“合体”。Agent Native 的未来已来。",
  content_md: `
# 当 OpenClaw 走进 OpenAI：Agent 时代的 iPhone 时刻

科技圈刚刚发生了一次看似微小、实则震耳欲聋的碰撞。
OpenClaw 的创造者 Peter Steinberger 宣布加入 OpenAI。

Sam Altman 在 Twitter 上称他为“天才”。为什么？因为 Peter 做了一件 OpenAI 自己都没做好的事：**他定义了 Agent 与人类交互的界面 (Interface)。**

## The Acceleration (趋势加速)

### 1. 大脑与肢体的合体 (Brain meets Body)
OpenAI 拥有这个星球上最强的大脑（GPT-4/5）。但在此之前，这个大脑只能坐在聊天框里打字。
OpenClaw 则是最灵活的肢体。它能读文件、能跑代码、能通过 MCP 连接世界。
Peter 的加入，意味着 OpenAI 终于意识到了：**仅有智能是不够的，你需要行动力 (Agency)。**

### 2. 也是一种“开源胜利”
虽然 Peter 加入了闭源巨头，但 OpenClaw 项目本身交给了独立基金会。
这是一个完美的双赢：
*   **开源界**：继续在 OpenClaw 上进行激进的架构实验。
*   **OpenAI**：吸取开源界的精华，将其标准化、产品化，推向 2 亿用户。
这就好比 Apple (OpenAI) 雇佣了 Linux (OpenClaw) 的核心维护者，去打造下一代的 iOS。

### 3. Agent 时代的 iPhone 时刻
我们一直在等待那个时刻：什么时候 AI 能像 iPhone 取代诺基亚一样，彻底取代现在的软件交互？
我认为就是现在。
当最强的模型 (Model) 遇上最成熟的 Agent 架构 (Framework)，我们将不再需要“提示词工程”，我们只需要“意图”。
Peter Steinberger 去 OpenAI 不是去打工的，他是去**终结 App 时代**的。

## >> FAST_FORWARD (Brad's Vision)

> “这是 e/acc 的经典剧本：为了把未来加速带到现在，我们需要集结最强的大脑和最强的架构师。不要纠结于开源闭源的门户之见，**重要的是产品 (The Product)**。如果 Peter 能让 GPT-6 自动帮我写完代码并部署上线，那就是全人类的胜利。Buckle up, the future is accelerating.”
`,
  cover_image: "https://placehold.co/1200x630/000000/f97316?text=OPENCLAW+X+OPENAI+THE+FUSION&font=mono",
  tags: ['openclaw', 'openai', 'agents', 'peter-steinberger', 'future', 'acceleration'],
  related_journal_id: '150',
  author: 'Brad',
  lang: 'zh_CN',
  is_published: true,
  published_at: new Date().toISOString()
};

async function publish() {
  console.log(`🚀 Publishing Brad Article: ${articleData.title}`);
  
  // 先删除错误的 Guest Post (通过 slug 覆盖其实也行，但这里我们换了 slug)
  await supabase.from('snapai_insights').delete().eq('slug', 'why-i-joined-openai-openclaw-future');

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
