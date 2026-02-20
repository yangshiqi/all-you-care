// scripts/check-missing-translations.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  // Get all ZH articles
  const { data: zhArticles } = await supabase
    .from('snapai_insights')
    .select('slug, title, author')
    .eq('lang', 'zh_CN');

  // Get all EN articles
  const { data: enArticles } = await supabase
    .from('snapai_insights')
    .select('slug')
    .eq('lang', 'en');
  
  const enSlugs = new Set(enArticles.map(a => a.slug));
  
  const missing = zhArticles.filter(a => !enSlugs.has(a.slug));
  
  console.log(`Found ${missing.length} articles missing EN translation:\n`);
  missing.forEach(a => {
    console.log(`- [${a.author}] ${a.title} (${a.slug})`);
  });
  
  // Output JSON for the sub-agent to consume if needed
  // console.log(JSON.stringify(missing));
}

check();
