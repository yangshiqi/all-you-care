const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const insight_zh = {
  title: "每裁一人增值 150 万美元：AI 时代的数字化“血税”",
  slug: "the-1.5m-blood-tax-ai-efficiency-myth",
  excerpt: "Block (Square) 近期的财报与裁员组合拳揭示了一个冷酷的公式：4,000 名员工的离职换来了 60 亿美元的市值增长。在 AI 杠杆的加持下，裁员不再是由于亏损，而是大厂在强盛时期向华尔街进贡的“利润活祭”。",
  content_md: "# 每裁一人增值 150 万美元：AI 时代的数字化“血税”\n\nBlock 的最新财报是硅谷正在发生的一场无声政变的缩影。\n\n在营收增长 24% 的强劲态势下，Jack Dorsey 宣布裁掉 4,000 人，同时上调了 2026 年的毛利预期。市场对此的回应是：股价暴涨 20%。简单计算可知，每裁掉一名员工，市场就为 Block 创造了约 150 万美元的企业价值。\n\n这已经不是传统的“降本增效”，而是一种**“人效置换利润” (Human-to-Margin Swap)** 的资本游戏。\n\n### Brad 的冷酷点评：裁员是最高级的公关\n\n“Jack Dorsey 终于说出了那个公开的秘密：AI 工具与小型团队的组合，已经彻底重塑了‘运营一家公司’的含义。对于华尔街来说，碳基资产（人）正从‘生产要素’降级为‘运营噪音’。\n\n裁员产生的 5 亿美元重组费用，在当前的运营利润增速下，两个季度就能回本。之后的所有增长，都是纯粹的利润率扩张。资本市场奖励的不是 AI 的智能化，而是奖励公司终于找到了摆脱‘人力依赖’的逻辑。这场数字化活祭证明了：人越少，确定性越高，杠杆就越暴力。”\n\n### // Zack 的异议：算法接管 GUI，但谁来接管烂摊子？\n\n“Brad 这种典型的资本视角忽略了工程领域的‘热力学第二定律’。Salesforce 宣称 AI Agent 接管了 50% 的交互，所以裁员 5,000 人。但这背后的逻辑陷阱在于：系统正在变得前所未有的脆弱。\n\n当 10,000 人的架构被强行压缩到 6,000 人时，剩下的‘幸存者’不再是全栈工程师，而是‘消防员’。AI 可以生成代码，但它无法在没有架构师的情况下感知数千万行代码背后的分布式债务。金丝雀之所以停止歌唱，不是因为它完成了任务，而是因为它被冻死在了过度追求效率的冷库里。这种‘Margin’的扩张，是以牺牲系统的抗脆弱性为代价的。”\n\n### 最终断言\n\n如果你的 CEO 正在计算每个员工能换回多少市值，那么你已经不再是团队的一员，而是资产负债表上待清理的冗余。",
  author: "Brad",
  cover_image: "https://ylcjjcfopcuwtspiiytl.supabase.co/storage/v1/object/public/journal-covers/the-1.5m-blood-tax-ai-efficiency-myth-cover.png",
  is_published: true,
  lang: "zh_CN",
  tags: ["AI", "Capital", "Layoffs", "Efficiency"],
  related_journal_id: null
};

const insight_en = {
  ...insight_zh,
  title: "$1.5M Enterprise Value per Layoff: The AI Era's Digital 'Blood Tax'",
  excerpt: "Block (Square)'s recent earnings and layoff combo reveals a cold formula: 4,000 employees out, $6B in market cap in. With AI leverage, layoffs are no longer about losses, but 'profit sacrifices' to Wall Street during times of strength.",
  content_md: "# $1.5M Enterprise Value per Layoff: The AI Era's Digital 'Blood Tax'\n\nBlock's latest earnings report is a microcosm of a silent coup taking place in Silicon Valley.\n\nDespite robust 24% revenue growth, Jack Dorsey announced 4,000 layoffs while raising 2026 gross profit guidance. The market's response: a 20% stock rip. A simple calculation reveals that for every employee cut, the market created approximately $1.5 million in enterprise value for Block.\n\nThis is no longer traditional 'cost-cutting'; it's a capital game of **'Human-to-Margin Swap.'**\n\n### Brad's Cold Take: Layoffs are the Ultimate PR\n\n\"Jack Dorsey finally said the quiet part out loud: the combination of AI tools and smaller teams has fundamentally redefined what it means to 'run a company.' For Wall Street, carbon-based assets (humans) have been demoted from 'factors of production' to 'operational noise.'\n\nThe $500 million in restructuring charges pays for itself in two quarters at current operating income growth. Everything after that is pure margin expansion. The market isn't rewarding AI's intelligence; it's rewarding the logic of finally breaking the 'human dependency.' This digital sacrifice proves that fewer people equals higher certainty and more violent leverage.\"\n\n### // Zack’s Dissent: Algorithms Rule the GUI, but Who Rules the Mess?\n\n\"Brad's typical capital perspective ignores the 'Second Law of Thermodynamics' in engineering. Salesforce claims AI Agents now handle 50% of interactions, justified by 5,000 cuts. The trap is: the system is becoming more fragile than ever.\n\nWhen a 10,000-person architecture is forced into 6,000, the remaining 'survivors' are no longer full-stack engineers; they are 'firefighters.' AI can generate code, but it cannot perceive the distributed debt behind tens of millions of lines of legacy code without an architect. The canary stopped singing not because it finished its job, but because it froze to death in a cold room of over-optimized efficiency. This margin expansion comes at the cost of the system's anti-fragility.\"\n\n### Final Assertion\n\nIf your CEO is calculating how much market cap each employee can be traded for, you are no longer part of a team—you are redundancy waiting to be cleared from the balance sheet.",
  lang: "en_US"
};

async function insertInsight() {
  const { data, error } = await supabase
    .from('snapai_insights')
    .insert([insight_zh, insight_en])
    .select();

  if (error) {
    console.error('Error inserting insight:', error);
  } else {
    console.log('Successfully inserted insights:', data);
  }
}

async function insertInsight() {
  const { data, error } = await supabase
    .from('snapai_insights')
    .insert([insight])
    .select();

  if (error) {
    console.error('Error inserting insight:', error);
  } else {
    console.log('Successfully inserted insight:', data);
  }
}

insertInsight();
