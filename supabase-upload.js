const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function uploadImage(filePath, bucketName, destPath) {
  const fileBuffer = fs.readFileSync(filePath);
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(destPath, fileBuffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(destPath);

  return publicUrlData.publicUrl;
}

const images = [
  { local: 'the-1.5m-blood-tax.png', remote: 'the-1.5m-blood-tax-ai-efficiency-myth-cover.png' }
];

async function main() {
  for (const img of images) {
    console.log(`Uploading ${img.local}...`);
    const url = await uploadImage(img.local, 'journal-covers', img.remote);
    if (url) {
      console.log(`Success! Public URL: ${url}`);
    }
  }
}

main();
