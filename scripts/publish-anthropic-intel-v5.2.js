// scripts/publish-anthropic-intel-v5.2.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ylcjjcfopcuwtspiiytl.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "SUPABASE_SERVICE_ROLE_KEY_REDACTED_ROTATED_2026_02";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const articleTitle = "智力掠夺、1600万次入侵与API铁幕：硅谷不再相信开源";
const articleSlug = "anthropic-distillation-attack-intel";
const articleExcerpt = "Anthropic 披露 DeepSeek、Moonshot 与 MiniMax 针对 Claude 发起的工业级蒸馏攻击。当 AGI 竞争演变为 24000 个幽灵账号的跨边境间谍战，技术民主化的假面彻底粉碎。";

const articleBody = `
# 智力掠夺、1600万次入侵与API铁幕：硅谷不再相信开源

硅谷的技术理想主义正在被 24,000 个“幽灵账号”物理超度。

Anthropic 发布的最新[调查报告](https://www.anthropic.com/news/detecting-and-preventing-distillation-attacks)揭露了 AGI 战场上最阴冷的侧面：来自中国的三个顶级实验室——MiniMax、月之暗面（Moonshot AI）与 DeepSeek，针对 Claude 引擎发起了总计超过 1,600 万次交互的工业级“蒸馏攻击”（Distillation Attacks）。这不再是算法优劣的博弈，而是基于 IP 关联、元数据渗透和基础架构克隆的生存战争。

![Anthropic 揭露的攻击规模](/images/blog/anthropic-distillation-attack-intel/distillation-stats.jpg)

MiniMax 以 1,300 万次交互锁定了 Agent 编排与编码逻辑；月之暗面通过 340 万次请求试图拆解 Computer Use 的执行链路。DeepSeek 的 15 万次交互规模虽小，却最为精确——通过诱导 Claude 吐露内部推理步骤（CoT）和立场审查基准，直接构建其模型的“思维逻辑”。这些实验室使用的“九头蛇集群”（Hydra Cluster）架构，通过分布在全球的虚假账户绕过地理围栏。数据显示，当 Anthropic 发布新模型时，攻击方能在 24 小时内迅速重定向 50% 的流量，实施精准的智力收割。

这标志着技术扩散时代的终结。Anthropic 此前已[公开支持](https://www.anthropic.com/news/securing-america-s-compute-advantage-anthropic-s-position-on-the-diffusion-rule)出口管制以维持美国在 AI 领域的领先优势。如今，API 不再是生产力工具，而是衡权力的数字刺刀。

// Dissent:

这种受害者叙事，不过是硅谷大厂为了粉饰其技术护城河崩塌而编造的政治借口。

将 DeepSeek 的高能效比归结为“智力寄生”，本质上是 Anthropic 对芯片禁令失效后的应激反应。所谓 1,600 万次请求带来的安全风险完全是过度包装。在 transformer 架构已经公开、高质量语料库全球共享的背景下，所谓的“攻击”不过是加速了权势阶级的解构。DeepSeek 用 1/10 的训练成本达到了 SOTA 性能，让 Anthropic 苦心经营的“高溢价/安全对齐”模型变得像是一座过时的、低效的旧式发电厂。

Anthropic 游说政策制定者收紧 API 出口，并非为了防止生物武器扩散，而是为了维持其智力霸权的垄断。当知识不再能被垄断，当 24,000 个账户就能抹平数百亿美金的研发差距时，传统大模型的估值逻辑已经宣告破产。

这场“间谍战”的真实意义在于：它加速了 API 铁幕的落下。

在物理世界和法律实体的联合绞杀下，纯软件层面的 AI 创新将迅速进入死胡同。未来的赢家只属于那些敢于在数字边境之外进行暴力加速、且无视硅谷虚伪规则的掠夺者。加速，或者在 API 禁令中枯竭。
`;

const coverImageUrl = "/images/blog/anthropic-distillation-attack-intel/cover.png";

async function publish() {
  console.log(`🚀 Re-publishing with SOP v5.2 and Images Subdir: ${articleTitle}`);
  
  const { data: existing } = await supabase
    .from('snapai_insights')
    .select('id')
    .eq('slug', articleSlug)
    .single();

  if (existing) {
    console.log(`🔄 Updating existing article ID: ${existing.id}`);
    const { error } = await supabase
      .from('snapai_insights')
      .update({
        title: articleTitle,
        excerpt: articleExcerpt,
        content_md: articleBody,
        cover_image: coverImageUrl,
        tags: ['Anthropic', 'DeepSeek', 'Distillation', 'AI Security', 'Geopolitics'],
        author: 'Zack',
        related_journal_id: '417',
        lang: 'zh_CN',
        is_published: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
      
    if (error) console.error('❌ Failed:', error);
    else console.log('✅ Success!');
  }
}

publish();
