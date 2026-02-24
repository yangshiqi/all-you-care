// scripts/publish-ibm-cobol-v5.2.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ylcjjcfopcuwtspiiytl.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsY2pqY2ZvcGN1d3RzcGlpeXRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA3NTc4NiwiZXhwIjoyMDc2NjUxNzg2fQ.Dep80iM9c8JwaNQwTn1AGpOWQAdPafsV-UoV2QatKDE";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const articleTitle = "尼克松时代的幽灵与 IBM 的死刑：Claude Code 如何暴力拆解万亿级护城河";
const articleSlug = "cobol-death-ibm-moat";
const articleExcerpt = "Anthropic 正在通过 Claude Code 物理超度 IBM 的核心资产。当 AI 抹平了理解遗留代码的‘成本壁垒’，传统 IT 咨询的低效套利模式便宣告破产。";

const articleBody = `
# 尼克松时代的幽灵与 IBM 的死刑：Claude Code 如何暴力拆解万亿级护城河

**核心动态**
*   IBM 股价受 Anthropic 博文直接冲击，市场对传统 IT 服务护城河的预期发生剧烈动摇。
*   COBOL 现状：处理全美 95% 的 ATM 交易，日运行代码达数千亿行，且绝大多数处于“无原作者、无文档、无替代者”的黑盒状态。
*   Anthropic 逻辑：Claude Code 通过自动化依赖映射与逻辑逆向工程，将 COBOL 现代化周期从“数年”压缩至“数个季度”。

IBM 最深的一道护城河从来不是技术先进性，而是遗留系统的“理解成本”。

这个模式极其隐秘且暴利：数万亿行尼克松时代构建的 COBOL 代码，如同金融与政务系统的地基。理解这些代码的代价比重写它们还要高，这让 IBM 为首的咨询巨头能持续数十年靠倒卖顾问的人力工时（Man-hours）来维持其庞大臃肿的资产负债表。Anthropic 的最新博文直接宣判了这种劳动力套利的终结。

![IBM 股价闪崩图](/images/blog/cobol-death-ibm-moat/ibm-stock-crash.jpg)

从财务模型看，当 Claude Code 能自动映射跨越数百个文件的隐式依赖关系时，传统咨询业务中占大头的“探索与发现”成本（Discovery phase）便瞬间归零。这意味着 IBM 超过 600 亿美元的服务积压订单（Backlog）正在缩水。资本市场的抛售行为揭露了残酷的真相：一切靠封闭技术生态与人为制造的复杂性所打造的壁垒，在 AI 面前都不具备防御价值。这不是进化，是针对 IT 咨询巨头的物理清算。

// Dissent:

这种将“代码翻译”等同于“系统重构”的乐观主义，完全无视了极长上下文推理在物理层面的高昂开销。

自动化映射 COBOL 的共享数据结构和全局状态，要求模型在 System 2 推理模式下维持数百万 Token 的工作记忆（KV Cache）。在处理那些几十年间被反复修改、逻辑高度耦合的屎山代码时，H100 仅 3.3 TB/s 的内存带宽将成为实时依赖追踪的死结。当模型试图逆向工程复杂的金融清算逻辑时，长程推理中的误差累积会导致极高的崩溃率。

a16z 的 TetrisBench 数据已经证明，模型在处理超出分布（OOD）的混乱系统时，成功率会大幅劣后于宣称的 Benchmark 成绩。这意味着，你所谓的“几个季度完成现代化”，其代价是极其恐怖的算力集群功耗支出，以及对英伟达 HBM3e 带宽的暴力压榨。

IBM 的雇佣兵可能老去，但模型在处理这些尼克松时代的幽灵代码时产生的“计算债务”，将是下一场现金流黑洞的开始。

这场战争的本质不是代码的迁移，而是将人类顾问的低效劳动，转移给极其昂贵的硅基算力。传统 IT 咨询注定死亡，但接管这场超度的 AI 巨头们，也会在吞噬这些几十年积累的逻辑熵（Entropy）时，感受到物理规律最无情的清算。
`;

const coverImageUrl = "/images/blog/cobol-death-ibm-moat/cover.png";

async function publish() {
  console.log(`🚀 Publishing: ${articleTitle}`);
  
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
        tags: ['Anthropic', 'IBM', 'COBOL', 'Claude Code'],
        author: 'Brad',
        related_journal_id: '416',
        lang: 'zh_CN',
        is_published: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
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
        tags: ['Anthropic', 'IBM', 'COBOL', 'Claude Code'],
        author: 'Brad',
        related_journal_id: '416',
        lang: 'zh_CN',
        is_published: true
      });
  }

  if (result.error) {
    console.error('❌ Failed:', result.error);
  } else {
    console.log('✅ Success!');
  }
}

publish();
