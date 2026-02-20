// scripts/fix-markdown-quotes.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixQuotes() {
  console.log('🔧 Fixing markdown quote positions...');

  const { data: blogs, error } = await supabase
    .from('snapai_insights')
    .select('id, title, content_md');

  if (error) {
    console.error('Error fetching blogs:', error);
    return;
  }

  for (const blog of blogs) {
    let content = blog.content_md;
    let hasChange = false;

    // Pattern 1: **“text”** -> “**text**” (Chinese double quotes)
    const pattern1 = /\*\*“([^”]+)”\*\*/g;
    if (pattern1.test(content)) {
      content = content.replace(pattern1, '“**$1**”');
      hasChange = true;
    }

    // Pattern 2: **‘text’** -> ‘**text**’ (Chinese single quotes)
    const pattern2 = /\*\*‘([^’]+)’\*\*/g;
    if (pattern2.test(content)) {
      content = content.replace(pattern2, '‘**$1**’');
      hasChange = true;
    }

    // Pattern 3: **"text"** -> "**text**" (English double quotes)
    const pattern3 = /\*\*"([^"]+)"\*\*/g;
    if (pattern3.test(content)) {
      content = content.replace(pattern3, '"**$1**"');
      hasChange = true;
    }

    if (hasChange) {
      console.log(`📝 Fixing: ${blog.title}`);
      const { error: updateError } = await supabase
        .from('snapai_insights')
        .update({ content_md: content })
        .eq('id', blog.id);
      
      if (updateError) console.error('Update failed:', updateError);
    }
  }
  console.log('✅ Done!');
}

fixQuotes();
