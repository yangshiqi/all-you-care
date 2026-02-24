// scripts/publish-anthropic-intel-en-v5.2.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ylcjjcfopcuwtspiiytl.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsY2pqY2ZvcGN1d3RzcGlpeXRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA3NTc4NiwiZXhwIjoyMDc2NjUxNzg2fQ.Dep80iM9c8JwaNQwTn1AGpOWQAdPafsV-UoV2QatKDE";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const articleTitle = "Intellectual Parasitism and Digital Bayonets: Anthropic Exposes the AGI Espionage War";
const articleSlug = "anthropic-distillation-attack-intel";
const articleExcerpt = "Anthropic unmasks DeepSeek, Moonshot, and MiniMax for industrial-scale distillation attacks on Claude. When AGI competition devolves into a borderless war of 24,000 ghost accounts, the mask of technical democratization shatters.";

const articleBody = `
# Intellectual Parasitism and Digital Bayonets: Anthropic Exposes the AGI Espionage War

Technical idealism in Silicon Valley is being physically liquidated by 24,000 \"ghost accounts.\"

Anthropic’s latest [investigative report](https://www.anthropic.com/news/detecting-and-preventing-distillation-attacks) reveals the coldest flank of the AGI battlefield: three premier Chinese labs—MiniMax, Moonshot AI, and DeepSeek—launched industrial-grade \"distillation attacks\" involving over 16 million exchanges with the Claude engine. This is no longer a contest of algorithmic superiority; it is a war of survival based on IP correlation, metadata infiltration, and infrastructure cloning.

![Attack Scale Exposed by Anthropic](/images/blog/anthropic-distillation-attack-intel/distillation-stats.jpg)

MiniMax targeted agentic orchestration and coding logic with 13 million exchanges. Moonshot utilized 3.4 million requests to deconstruct Computer Use execution chains. DeepSeek’s 150,000 exchanges, while smaller in volume, were the most precise—eliciting internal Chain-of-Thought (CoT) steps and alignment benchmarks to directly clone the \"thinking logic\" of Claude. These labs deployed \"Hydra Cluster\" architectures, leveraging globally distributed fraudulent accounts to bypass geofencing. Data shows that upon a new model release, attackers can redirect 50% of their traffic within 24 hours to execute immediate intellectual harvesting.

This marks the end of the era of technical diffusion. API access is no longer a productivity tool; it is a digital bayonet for geopolitical leverage. Anthropic has [openly supported](https://www.anthropic.com/news/securing-america-s-compute-advantage-anthropic-s-position-on-the-diffusion-rule) export controls to maintain America's lead, and this report provides the physical justification for the closing of the digital borders.

// Dissent:

This victim narrative is a political smokescreen designed by Silicon Valley incumbents to mask the collapse of their technical moats.

Attributing DeepSeek’s high efficiency-to-cost ratio to \"intellectual parasitism\" is a knee-jerk reaction to the failure of chip bans. The \"security risks\" of 16 million requests are grossly repackaged PR. In a world where transformer architectures are public and high-quality datasets are global, these \"attacks\" represent the inevitable deconstruction of the technocratic elite. DeepSeek achieved SOTA performance at 1/10th the training cost, rendering Anthropic’s \"high-premium, safety-aligned\" models as obsolete as coal-fired power plants.

Anthropic is lobbying policymakers to tighten API exports not to prevent bioweapon proliferation, but to preserve a monopoly on intelligence. When 24,000 accounts can erase a multi-billion dollar R&D gap, the valuation models of traditional frontier labs are bankrupt.

The true significance of this \"espionage war\" is the acceleration of the API Iron Curtain.

Under the combined pressure of physical resource constraints and legal warfare, pure-software AI innovation is hitting a dead end. Future winners belong to the predators who operate outside digital borders, embracing violent acceleration and ignoring the hypocritical rules of Silicon Valley. Accelerate, or wither behind an API ban.
`;

const coverImageUrl = "/images/blog/anthropic-distillation-attack-intel/cover.png";

async function publish() {
  console.log(`🚀 Publishing English Version: ${articleTitle}`);
  
  // Try to find if it exists for this specific language
  const { data: existing } = await supabase
    .from('snapai_insights')
    .select('id')
    .eq('slug', articleSlug)
    .eq('lang', 'en')
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
        related_journal_id: null,
        lang: 'en',
        is_published: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
      
    if (error) console.error('❌ Failed:', error);
    else console.log('✅ Success!');
  } else {
    console.log(`🆕 Inserting new article`);
    const { error } = await supabase
      .from('snapai_insights')
      .insert({
        title: articleTitle,
        slug: articleSlug,
        excerpt: articleExcerpt,
        content_md: articleBody,
        cover_image: coverImageUrl,
        tags: ['Anthropic', 'DeepSeek', 'Distillation', 'AI Security', 'Geopolitics'],
        author: 'Zack',
        related_journal_id: null,
        lang: 'en',
        is_published: true
      });
      
    if (error) console.error('❌ Failed:', error);
    else console.log('✅ Success!');
  }
}

publish();
