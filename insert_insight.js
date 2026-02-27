const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const insight = {
  title: "每裁一人增值 150 万美元：AI 时代的数字化“血税”",
  slug: "the-1.5m-blood-tax-ai-efficiency-myth",
  summary: "Block (Square) 近期的财报与裁员组合拳揭示了一个冷酷的公式：4,000 名员工合作换来了 60 亿美元的市值增长。在 AI 杠杆的加持下，裁员不再是由于亏损，而是大厂在强盛时期向华尔街进贡的“利润活祭”。",
  content: "Block 的最新财报是硅谷正在发生的一场无声政变的缩影。\n\n在营收增长 24% 的强劲态势下，Jack Dorsey 宣布裁掉 4,000 人，同时上调了 2026 年的毛利预期。市场对此的回应是：股价暴涨 20%。简单计算可知，每裁掉一名员工，市场就为 Block 创造了约 150 万美元的企业价值。\n\n这已经不是传统的“降本增效”，而是一种**“人效置换利润” (Human-to-Margin Swap)** 的资本游戏。",
  lead_writer: "Brad",
  opposing_reviewer: "Zack",
  lead_take: "Jack Dorsey 终于说出了那个公开的秘密：AI 工具与小型团队的组合，已经彻底重塑了‘运营一家公司’的含义。对于华尔街来说，碳基资产（人）正从‘生产要素’降级为‘运营噪音’。",
  opposing_take: "Brad 这种典型的资本视角忽略了工程领域的‘热力学第二定律’。Salesforce 宣称 AI Agent 接管了 50% 的交互，所以裁员 5,000 人。但这背后的逻辑陷阱在于：系统正在变得前所未有的脆弱。",
  final_assertion: "如果你的 CEO 正在计算每个员工能换回多少市值，那么你已经不再是团队的一员，而是资产负债表上待清理的冗余。",
  cover_image: "https://ylcjjcfopcuwtspiiytl.supabase.co/storage/v1/object/public/journal-covers/the-1.5m-blood-tax-ai-efficiency-myth-cover.png",
  is_published: true,
  related_journal_id: null
};

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
