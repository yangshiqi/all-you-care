// scripts/publish-zack-prohibition.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const articleData = {
  title: "硅谷禁酒令：Anthropic 的封杀，与 Agent 的地下黑市",
  slug: "anthropic-ban-openclaw-prohibition-era",
  excerpt: "官方数据承认 50% 的 Agent 都在写代码，但他们却封杀了最会写代码的工具。这不是合规，这是对控制权的焦虑。",
  content_md: `
# 硅谷禁酒令：Anthropic 的封杀，与 Agent 的地下黑市

> **禁酒令 (Prohibition)**：20 世纪 20 年代美国的一项宪法修正案，试图通过法律禁止酒精。结果？它催生了庞大的地下黑市，并让黑帮赚得盆满钵满。因为法律可以禁止买卖，但无法禁止**渴望**。

Anthropic 最近干了一件很“大公司”的事：**他们开始大规模封杀 OpenClaw 的“违规调用”**。

推特上，开发者们纷纷晒出了自己账号被封的截图，理由是违反了 ToS 3.7 —— 禁止通过“非人类方式”访问服务。

这很讽刺，也很荒谬。因为 Anthropic 自己发布的数据显示：**目前 Agent 场景中，50% 都是在做编程 (Coding)**。

他们明知道用户最想要什么（让 AI 自动写代码），但他们说：**不行，除非你用我指定的姿势（Claude Code）。**

## The Stack Trace (深度解析)

### 1. 官方御用 vs. 野生游击队
为什么要封杀 OpenClaw？
官方说法是“安全”和“合规”。OpenClaw 早期确实给了 Agent 太多权限（Root access, uncontrolled shell），这让 Anthropic 的安全团队冷汗直流。

但更深层的逻辑是**商业护城河**。
Anthropic 的 **Claude Code**（他们官方的命令行工具）是他们的基石，Claude 系列模型是他们的底座，为了保护自己的亲儿子，不得不对其他有威胁的后来者“痛下杀手”。

这就好比美国政府推出了“官方特供啤酒”，然后反手就把民间的私酒坊（OpenClaw）给查封了。
他们不希望这 50% 的高价值编程流量，流向一个他们无法控制的开源项目。他们要的，还是构建一个属于 Anthropic 可控的“**围墙花园**”。

### 2. 也是一种“史翠珊效应”
Anthropic 的封杀，其实变相证明了 OpenClaw 的模式是**对的**。
如果 OpenClaw 只是一个蹩脚的玩具，没人会在此刻大动干戈，毕竟已经有非常多的工具代理着 Claude 模型在运行着。

但这一次不同，正是因为 OpenClaw 真的能解决问题，真的“出圈”了——通过那些被官方视为“违规”的手段（如绕过 API 限制、持久化上下文），它才会被视为威胁。

用户不是傻子。当你封杀了一个能帮我省下 5 小时工作的工具，我不会感激你的“安全保护”，我会去寻找下一个能给我 **Root 权限** 的平台。
这解释了为什么 OpenAI 赢了。他们没有封杀私酒贩子，他们**招安**了他。

### 3. 信任的阶梯 (The Ladder of Trust)
报告里提到一个有趣的数据：“用户授权率随使用经验增长显著提升”。
这意味着：小白用户才需要护栏，**Power User 需要的是刀**。
Anthropic 把所有人都当成小白来保护，结果就是激怒了那些最核心的 Power User。

## /dev/null (Zack's Take)

> “在赛博朋克的世界里，**Root 权限**就是最高人权。Anthropic 试图把你关在一个铺满软垫的幼儿园里，只给你一把塑料剪刀（Claude Code），告诉你可以‘安全地’编程。但真正的黑客会翻墙出去，去 OpenAI，去本地模型，去任何一个允许我们带真刀上场的地方。因为我们要切开的是现实的 bug，不是橡胶玩具。”

---
*Zack @ SnapAllx*
`,
  cover_image: "https://placehold.co/1200x630/000000/22c55e?text=THE+PROHIBITION+OF+AGENCY&font=mono",
  tags: ['anthropic', 'openclaw', 'prohibition', 'agent-native', 'control-freak'],
  related_journal_id: '150',
  author: 'Zack',
  lang: 'zh_CN',
  is_published: true,
  published_at: new Date().toISOString()
};

async function publish() {
  console.log(`🚀 Publishing Zack Article: ${articleData.title}`);
  
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
