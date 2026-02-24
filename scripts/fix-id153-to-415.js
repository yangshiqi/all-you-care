// scripts/fix-id153-to-415.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ylcjjcfopcuwtspiiytl.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "SUPABASE_SERVICE_ROLE_KEY_REDACTED_ROTATED_2026_02";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fix() {
  console.log(`🔧 Fixing related_journal_id for slug: stargate-stalled-ai-geopolitics`);
  
  const { data, error } = await supabase
    .from('snapai_insights')
    .update({
      related_journal_id: '415'
    })
    .eq('slug', 'stargate-stalled-ai-geopolitics')
    .select()
    .single();

  if (error) {
    console.error('❌ Update failed:', error);
  } else {
    console.log(`✅ Updated successfully! New related_journal_id: ${data.related_journal_id}`);
  }
}

fix();
