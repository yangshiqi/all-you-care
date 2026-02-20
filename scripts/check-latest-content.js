// scripts/check-latest-content.js
// 动态导入 supabase-js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkLatestContent() {
  console.log('🔍 Checking latest content from n8n-ai-contents (lang=zh_CN)...');
  
  const { data, error } = await supabase
    .from('n8n-ai-contents')
    .select('id, title, created_at, content, summary')
    .eq('lang', 'zh_CN')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Error fetching content:', error);
    return;
  }

  if (!data) {
    console.log('⚠️ No content found.');
    return;
  }

  console.log('✅ Latest Content Found:');
  console.log('----------------------------------------');
  console.log(`ID: ${data.id}`);
  console.log(`Title: ${data.title}`);
  console.log(`Created At: ${data.created_at}`);
  console.log('----------------------------------------');
  console.log('Summary Preview:');
  console.log(data.summary ? data.summary.substring(0, 200) + '...' : '(No summary)');
  console.log('----------------------------------------');
  // 截取更长一点看看内容到底咋样
  console.log('Content Preview (First 500 chars):');
  console.log(data.content ? data.content.substring(0, 500) + '...' : '(No content)');
  console.log('----------------------------------------');
}

checkLatestContent();
