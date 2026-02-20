// scripts/translate-blogs.js
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Env Check
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const PERSONA_GUIDES = {
  'Zack': `
    - **Tone**: Cynical, rebellious, punchy. Use hacker slang (slop, grift, wrapper).
    - **Style**: Short sentences. Rhetorical questions. Anti-establishment.
    - **Example**: Instead of "The cost is high", say "The bill is a ransom note".
  `,
  'Brad': `
    - **Tone**: Visionary, enthusiastic, e/acc. High energy.
    - **Style**: Grand narratives. "Paradigm Shift", "Revolution".
    - **Example**: Instead of "Apps will change", say "The App Store is a graveyard".
  `,
  'Tom': `
    - **Tone**: Technical, precise, dry. Engineering-focused.
    - **Style**: Use exact terms (latency, throughput, quantization). No fluff.
    - **Example**: Instead of "It is fast", say "Inference latency dropped by 100x".
  `,
  'Tim': `
    - **Tone**: Somber, warning, skeptical. "Black Mirror" vibes.
    - **Style**: Philosophical, concerned about privacy/control.
    - **Example**: Instead of "Privacy is a concern", say "We are building a digital panopticon".
  `
};

async function translateContent(blog) {
  const persona = PERSONA_GUIDES[blog.author] || PERSONA_GUIDES['Zack']; // Default to Zack if unknown
  
  const prompt = `
  You are an expert translator and editor. Your task is to **transcreate** (translate creatively) a Chinese tech blog post into English.
  
  ## The Persona
  You must write in the voice of **${blog.author}**.
  ${persona}
  
  ## The Constraints
  1.  **Format**: Keep the exact Markdown structure (headings, bolding, links).
  2.  **Links**: Preserve all URLs and citation links exactly as they are.
  3.  **Title**: Translate the title to be catchy and SEO-friendly in English.
  4.  **Excerpt**: Translate the excerpt to be a punchy hook.
  5.  **Quote**: Translate the final quote to be memorable.
  
  ## The Content (Chinese)
  Title: ${blog.title}
  Excerpt: ${blog.excerpt}
  Body:
  ${blog.content_md}
  
  ## Output
  Return ONLY the JSON object with the following fields:
  {
    "title": "English Title",
    "excerpt": "English Excerpt",
    "content_md": "English Markdown Body"
  }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Clean up markdown code blocks if present
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error(`Error translating ${blog.title}:`, e);
    return null;
  }
}

async function run() {
  console.log('🚀 Starting Blog Translation...');

  // 1. Fetch ZH blogs that don't have an EN counterpart yet
  // Ideally we check existence, but for simplicity we'll just fetch all ZH and upsert EN.
  const { data: blogs, error } = await supabase
    .from('snapai_insights')
    .select('*')
    .eq('lang', 'zh_CN');

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  console.log(`Found ${blogs.length} articles to translate.`);

  for (const blog of blogs) {
    console.log(`\n📝 Translating: ${blog.title} (${blog.author})...`);
    
    // Check if EN version already exists
    const { data: existing } = await supabase
      .from('snapai_insights')
      .select('id')
      .eq('slug', blog.slug)
      .eq('lang', 'en')
      .single();
      
    if (existing) {
      console.log('   ⏭️  EN version already exists. Skipping.');
      continue;
    }

    const translated = await translateContent(blog);
    
    if (translated) {
      // Insert EN version
      const { error: insertError } = await supabase
        .from('snapai_insights')
        .insert({
          ...blog, // Copy all fields (slug, tags, images, ids)
          id: undefined, // Let DB generate new ID
          title: translated.title,
          excerpt: translated.excerpt,
          content_md: translated.content_md,
          lang: 'en', // Set lang to EN
          created_at: new Date().toISOString(), // New timestamp
          updated_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('   ❌ Insert failed:', insertError.message);
      } else {
        console.log('   ✅ Published EN version!');
      }
    }
  }
}

run();
