// scripts/get-full-content.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getFullContent() {
  const { data, error } = await supabase
    .from('n8n-ai-content-pre-publish')
    .select('content')
    .limit(1)
    .single(); // Get the latest one

  if (data && data.content) {
    console.log(data.content);
  } else {
    console.error('No content found');
  }
}

getFullContent();
