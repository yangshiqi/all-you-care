// scripts/fix-en-slugs.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ylcjjcfopcuwtspiiytl.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsY2pqY2ZvcGN1d3RzcGlpeXRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA3NTc4NiwiZXhwIjoyMDc2NjUxNzg2fQ.Dep80iM9c8JwaNQwTn1AGpOWQAdPafsV-UoV2QatKDE";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("🔧 Fixing English slugs to match Chinese versions...");

  // 1. Fix IBM/COBOL
  const { error: err1 } = await supabase
    .from('snapai_insights')
    .update({ slug: 'cobol-death-ibm-moat' })
    .eq('slug', 'ghosts-nixon-era-ibm-death-sentence')
    .eq('lang', 'en');
  if (err1) console.error("❌ Failed err1:", err1);
  else console.log("✅ Fixed IBM/COBOL English slug.");

  // 2. Fix Anthropic Distillation
  const { error: err2 } = await supabase
    .from('snapai_insights')
    .update({ slug: 'anthropic-distillation-attack-intel' })
    .eq('slug', 'intellectual-parasitism-anthropic-exposes-ai-espionage')
    .eq('lang', 'en');
  if (err2) console.error("❌ Failed err2:", err2);
  else console.log("✅ Fixed Anthropic Distillation English slug.");
}

run();
