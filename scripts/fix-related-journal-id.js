// scripts/fix-related-journal-id.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ylcjjcfopcuwtspiiytl.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "SUPABASE_SERVICE_ROLE_KEY_REDACTED_ROTATED_2026_02";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fix() {
  console.log(`🔧 Removing non-existent related_journal_id for slug: anthropic-distillation-attack-intel`);
  
  const { data, error } = await supabase
    .from('snapai_insights')
    .update({
      related_journal_id: null
    })
    .eq('slug', 'anthropic-distillation-attack-intel')
    .select()
    .single();

  if (error) {
    console.error('❌ Update failed:', error);
  } else {
    console.log(`✅ Fixed! related_journal_id is now NULL.`);
  }
}

fix();
