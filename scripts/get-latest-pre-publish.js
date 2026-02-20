// scripts/get-latest-pre-publish.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) process.exit(1);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('n8n-ai-content-pre-publish')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('--- ID ---');
  console.log(data.id);
  console.log('--- TITLE ---');
  console.log(data.title);
  console.log('--- CONTENT ---');
  console.log(data.content);
}

run();
