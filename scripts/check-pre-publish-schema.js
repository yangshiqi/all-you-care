// scripts/check-pre-publish-schema.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSchema() {
  console.log('🔍 Checking latest content from n8n-ai-content-pre-publish...');
  
  // 尝试获取最新一条，看看有哪些字段
  const { data, error } = await supabase
    .from('n8n-ai-content-pre-publish')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Error fetching content:', error);
    return;
  }

  if (!data) {
    console.log('⚠️ No content found in n8n-ai-content-pre-publish.');
    return;
  }

  console.log('✅ Found content! Fields available:');
  console.log(Object.keys(data).join(', '));
  
  console.log('\n--- Content Preview (First 500 chars) ---');
  // 重点检查 content 字段是否是 Markdown
  console.log(data.content ? data.content.substring(0, 500) + '...' : '(No content)');
  
  // 检查发布状态字段
  console.log('\n--- Publish Status ---');
  console.log(`is_publish: ${data.is_publish}`); // 之前报错说没有 is_published，可能是 is_publish
  console.log(`is_published: ${data.is_published}`);
}

checkSchema();
