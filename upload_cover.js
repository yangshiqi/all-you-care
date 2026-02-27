const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function upload() {
  const filePath = '/Users/ysq/.openclaw/agents/snapai/the-1.5m-blood-tax-en.png';
  const destPath = 'the-1.5m-blood-tax-ai-efficiency-myth-cover.png';
  const bucket = 'journal-covers';

  console.log('Reading file from:', filePath);
  const fileBuffer = fs.readFileSync(filePath);

  console.log('Uploading to Supabase...');
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(destPath, fileBuffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (error) {
    console.error('Upload failed:', error);
    return;
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(destPath);

  console.log('SUCCESS_URL:', publicUrlData.publicUrl);
}

upload();
