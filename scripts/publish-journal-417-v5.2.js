// scripts/publish-journal-417-v5.2.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://ylcjjcfopcuwtspiiytl.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "SUPABASE_SERVICE_ROLE_KEY_REDACTED_ROTATED_2026_02";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const slug = "saas-agent-compute-wall";
const coverImageUrl = `/images/blog/${slug}/cover.png`;

async function publish() {
  console.log(`🚀 Publishing Journal 417 Expansion (SOP v5.2)...`);

  const zhContent = fs.readFileSync(path.join(__dirname, '../content/drafts/saas-agent-compute-wall/article.md'), 'utf8');
  const enContent = fs.readFileSync(path.join(__dirname, '../content/drafts/saas-agent-compute-wall/article-en.md'), 'utf8');

  const commonData = {
    slug,
    cover_image: coverImageUrl,
    author: 'Brad',
    related_journal_id: '417',
    is_published: true,
    published_at: new Date().toISOString()
  };

  // Publish ZH
  console.log(`🇨🇳 Upserting ZH version...`);
  const { error: zhError } = await supabase
    .from('snapai_insights')
    .upsert({
      ...commonData,
      title: "SaaS 席位制死亡与百亿美元蒸馏游戏",
      excerpt: "月之暗面估值破百亿，Anthropic 揭露工业级间谍战，OpenAI 向物理基建低头。当 Agent 接管工作流，传统 SaaS 的席位估值模型正在土崩瓦解。",
      content_md: zhContent,
      lang: 'zh_CN',
      tags: ['SaaS', 'Agent', 'Kimi', 'Anthropic', 'OpenAI', 'Compute']
    }, { onConflict: 'slug,lang' });
  
  if (zhError) console.error("❌ ZH Error:", zhError);
  else console.log("✅ ZH Success!");

  // Publish EN
  console.log(`🇺🇸 Upserting EN version...`);
  const { error: enError } = await supabase
    .from('snapai_insights')
    .upsert({
      ...commonData,
      title: "The Death of Per-Seat SaaS and the Ten-Billion-Dollar Distillation Game",
      excerpt: "Kimi hits $12B valuation while Anthropic unmasks industrial-scale espionage. As Agents hijack workflows, the traditional per-seat SaaS valuation model is disintegrating.",
      content_md: enContent,
      lang: 'en',
      tags: ['SaaS', 'Agent', 'Kimi', 'Anthropic', 'OpenAI', 'Compute']
    }, { onConflict: 'slug,lang' });

  if (enError) console.error("❌ EN Error:", enError);
  else console.log("✅ EN Success!");
}

publish();
