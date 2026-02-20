// scripts/generate-snapai-blog.js
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Load env vars
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
  console.error('❌ Missing required environment variables!');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or ANON), GOOGLE_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// Using gemini-1.5-pro for better reasoning/writing
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Persona Definitions
const EDITORS = ['zack', 'tom', 'brad', 'tim'];

function getEditorFromArgs() {
  const args = process.argv.slice(2);
  const editorArg = args.find(arg => arg.startsWith('--editor='));
  
  if (editorArg) {
    const editor = editorArg.split('=')[1].toLowerCase();
    if (EDITORS.includes(editor)) {
      return editor;
    }
    console.warn(`⚠️ Unknown editor "${editor}". Available: ${EDITORS.join(', ')}.`);
  }
  
  // Random selection if not specified or invalid
  const randomEditor = EDITORS[Math.floor(Math.random() * EDITORS.length)];
  console.log(`🎲 Randomly selected editor: ${randomEditor.toUpperCase()}`);
  return randomEditor;
}

async function generateBlog() {
  const selectedEditor = getEditorFromArgs();
  console.log(`🚀 SnapAI Blog Generator | Editor: ${selectedEditor.toUpperCase()}`);

  // 1. Fetch content
  console.log('🔍 Fetching latest UNPUBLISHED content from n8n-ai-content-pre-publish...');
  const { data: rawContent, error: fetchError } = await supabase
    .from('n8n-ai-content-pre-publish')
    .select('*')
    //.eq('is_publish', false) // Optional: uncomment to process only new items
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !rawContent) {
    console.error('❌ Error fetching content:', fetchError);
    return;
  }

  console.log(`✅ Found Content: "${rawContent.title}" (ID: ${rawContent.id})`);

  // 2. Load Persona Prompt
  const promptPath = path.join(__dirname, `../prompts/insight-${selectedEditor}.md`);
  if (!fs.existsSync(promptPath)) {
    console.error(`❌ Prompt file not found: ${promptPath}`);
    return;
  }
  
  let promptTemplate = fs.readFileSync(promptPath, 'utf8');
  
  // Inject variables
  const finalPrompt = promptTemplate
    .replace('{{title}}', rawContent.title || 'Untitled')
    .replace('{{content}}', rawContent.content || rawContent.summary || '')
    .replace('{{journal_id}}', rawContent.id);

  // 3. Generate
  console.log(`🧠 ${selectedEditor.toUpperCase()} is writing...`);
  
  try {
    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const blogPost = response.text();
    
    console.log('✅ Generation complete!');

    // 4. Parse & Save
    const frontmatterMatch = blogPost.match(/^---\n([\s\S]*?)\n---/);
    let metadata = { title: rawContent.title, slug: `insight-${Date.now()}`, tags: [] };
    let contentMd = blogPost;

    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      
      // Simple parsing
      const slugMatch = frontmatter.match(/slug:\s*(.+)/);
      const titleMatch = frontmatter.match(/title:\s*(.+)/);
      const excerptMatch = frontmatter.match(/excerpt:\s*(.+)/);
      const authorMatch = frontmatter.match(/author:\s*(.+)/);
      
      if (slugMatch) metadata.slug = slugMatch[1].trim();
      if (titleMatch) metadata.title = titleMatch[1].trim();
      if (excerptMatch) metadata.excerpt = excerptMatch[1].trim();
      if (authorMatch) metadata.author = authorMatch[1].trim();
      
      // Extract tags roughly
      const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);
      if (tagsMatch) {
        metadata.tags = tagsMatch[1].split(',').map(t => t.trim());
      }

      // Remove frontmatter from body
      contentMd = blogPost.replace(/^---\n[\s\S]*?\n---/, '').trim();
    }

    const newInsight = {
      title: metadata.title,
      slug: metadata.slug,
      excerpt: metadata.excerpt,
      content_md: contentMd,
      related_journal_id: rawContent.id,
      tags: metadata.tags,
      author: metadata.author || selectedEditor.charAt(0).toUpperCase() + selectedEditor.slice(1), // Fallback
      lang: 'zh_CN',
      is_published: true, // Auto-publish for now
      published_at: new Date().toISOString()
    };

    console.log(`💾 Saving to DB (Author: ${newInsight.author})...`);
    
    const { data: saved, error: saveError } = await supabase
      .from('snapai_insights')
      .insert(newInsight)
      .select()
      .single();

    if (saveError) {
      console.error('❌ DB Error:', saveError);
    } else {
      console.log(`🎉 Published: ${saved.title}`);
      console.log(`🔗 Slug: ${saved.slug}`);
    }

  } catch (err) {
    console.error('❌ Generation Error:', err);
  }
}

generateBlog();
