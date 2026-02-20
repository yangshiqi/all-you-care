// scripts/generate-snapai-blog-v3.js
// SnapAI Blog Generator v3.1 - Live Research Edition
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Env Check
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;
const BRAVE_API_KEY = process.env.BRAVE_API_KEY; // Need to pass this in env

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY || !BRAVE_API_KEY) {
  console.error('❌ Missing ENV variables. Need SUPABASE, GOOGLE_API_KEY, and BRAVE_API_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// --- Real Web Research Tool ---
async function performWebSearch(query) {
  console.log(`🔎 Searching Brave for: "${query}"...`);
  try {
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=3`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': BRAVE_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`Brave API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.web?.results || [];
    
    return results.map(r => `[${r.title}](${r.url}): ${r.description}`).join('\n\n');
  } catch (err) {
    console.error('❌ Search failed:', err.message);
    return "";
  }
}

// --- Research Agent Logic ---
async function researchAndFactCheck(rawTitle, rawContent) {
  console.log('🕵️‍♂️ [Step 4] Deep Research & Fact Check...');
  
  // 1. Generate Search Queries using LLM (Simulated for speed, or could call LLM)
  // Simple heuristic: Search for the title + "analysis" or "benchmark"
  const queries = [
    `${rawTitle} analysis review`,
    `${rawTitle} benchmark data`,
    `${rawTitle} controversy`
  ];
  
  // Also extract entities from title for better search
  // e.g., "Claude 4.6" -> "Claude 4.6 token cost"
  if (rawTitle.includes('Claude')) queries.push('Claude 4.6 token cost increase');
  if (rawTitle.includes('OpenAI')) queries.push('OpenAI Disney deal analysis');

  let researchContext = "";
  
  // Execute searches (limit to first 2 distinct queries to save time/tokens)
  const uniqueQueries = [...new Set(queries)].slice(0, 2);
  
  for (const q of uniqueQueries) {
    const results = await performWebSearch(q);
    if (results) {
      researchContext += `### Search Results for "${q}":\n${results}\n\n`;
    }
  }
  
  return researchContext;
}

async function generateBlogV3() {
  const args = process.argv.slice(2);
  const editorArg = args.find(arg => arg.startsWith('--editor='));
  const editor = editorArg ? editorArg.split('=')[1] : 'zack'; // Default to Zack

  console.log(`🚀 SnapAI Blog Generator v3.1 | Editor: ${editor.toUpperCase()}`);

  // 1. Fetch
  const { data: rawContent } = await supabase
    .from('n8n-ai-content-pre-publish')
    .select('*')
    .eq('id', 149) // Still targeting 149 for demo
    .single();

  if (!rawContent) { console.error('No content found'); return; }

  // 4. Deep Research (Live)
  const researchContext = await researchAndFactCheck(rawContent.title, rawContent.content);

  // 5. Draft with Persona
  const promptPath = path.join(__dirname, `../prompts/insight-${editor}.md`);
  let promptTemplate = fs.readFileSync(promptPath, 'utf8');
  
  const augmentedPrompt = promptTemplate + `
  
## V3.1 MANDATE: EVIDENCE-BASED WRITING
You are provided with real-time "Research Context" from the web.
1.  **Synthesize**: Combine the raw news with the search results.
2.  **Verify**: If search results contradict the news, point it out.
3.  **Cite**: Use markdown links [Title](URL) from the search results to back up your claims.

## Research Context
${researchContext}
  `;

  const finalPrompt = augmentedPrompt
    .replace('{{title}}', rawContent.title)
    .replace('{{content}}', rawContent.content)
    .replace('{{journal_id}}', rawContent.id);

  console.log(`🧠 ${editor.toUpperCase()} is drafting...`);
  
  const result = await model.generateContent(finalPrompt);
  const response = await result.response;
  const blogPost = response.text();

  console.log('✅ Draft generated!');
  console.log(blogPost.substring(0, 500));
  
  // (Saving logic omitted for brevity in this test run)
}

generateBlogV3();
