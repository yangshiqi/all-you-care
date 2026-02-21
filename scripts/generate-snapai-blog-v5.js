// scripts/generate-snapai-blog-v5.js
// SnapAI Blog Generator v5.1 - Strategic Intelligence & Journal-ID De-duplication Edition
const { createClient } = require('@supabase/supabase-js');

// Env Check
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing ENV variables. Need SUPABASE URL and KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('🚀 SnapAI SOP v5.1: Initializing Intelligence Sweep...');

  // STEP 1: Fetch with De-duplication based on journal_id
  console.log('🔍 [Step 1] Fetching raw data with journal_id de-duplication check...');
  
  // 1.1 Get already processed related_journal_ids
  const { data: processedInsights, error: processedError } = await supabase
    .from('snapai_insights')
    .select('related_journal_id');

  if (processedError) {
    console.error('❌ Error fetching processed IDs:', processedError);
    return;
  }

  const processedJournalIds = processedInsights
    .map(p => p.related_journal_id ? parseInt(p.related_journal_id) : null)
    .filter(id => id !== null && !isNaN(id));

  console.log(`📊 Found ${processedJournalIds.length} already processed journal_ids.`);

  // 1.2 Fetch latest unpublished/unprocessed content
  let query = supabase
    .from('n8n-ai-content-pre-publish')
    .select('*')
    .eq('is_publish', true); // Only process what is marked ready by n8n

  if (processedJournalIds.length > 0) {
    // Filter out processed journal_ids to avoid "multiple interpretations of the same content"
    // Note: We filter n8n-ai-content-pre-publish.journal_id
    query = query.not('journal_id', 'in', `(${processedJournalIds.join(',')})`);
  }

  const { data: targetContent, error: fetchError } = await query
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error('❌ Error fetching source data:', fetchError);
    return;
  }

  if (!targetContent) {
    console.log('✅ No new content (based on journal_id) to process. Mission accomplished for now.');
    return;
  }

  console.log(`🎯 [Target Found] ID: ${targetContent.id} | Journal ID: ${targetContent.journal_id} | Title: ${targetContent.title}`);
  console.log('---');
  console.log('Proceeding to SOP v5.1 Phase 2 (Signal Analysis)...');
  
  // Output the result for the Agent to consume.
  // Note: related_journal_id SHOULD BE targetContent.journal_id
  console.log(JSON.stringify({
    ...targetContent,
    suggested_related_journal_id: targetContent.journal_id
  }));
}

run();
