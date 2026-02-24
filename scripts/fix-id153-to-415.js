// scripts/fix-id153-to-415.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ylcjjcfopcuwtspiiytl.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsY2pqY2ZvcGN1d3RzcGlpeXRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA3NTc4NiwiZXhwIjoyMDc2NjUxNzg2fQ.Dep80iM9c8JwaNQwTn1AGpOWQAdPafsV-UoV2QatKDE";

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
