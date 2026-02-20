// scripts/setup-snapai-blog.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// 必须使用 service_role key 才能执行 DDL 或管理表结构
// 这里假设环境变量里有 SERVICE_ROLE_KEY，如果没有，我只能用 ANON KEY 试试能不能走 RPC (通常不行)
// 但更稳妥的是直接通过 SQL 接口 (Rest API 不支持 DDL)
// 这是一个变通方法：通过 RPC 调用 exec_sql (如果用户预埋了这个函数)
// 或者提示用户手动执行 SQL

const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase environment variables!');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function setupDatabase() {
  console.log('🚀 Setting up SnapAI Blog database table...');

  // 读取 SQL 文件
  const sqlPath = path.join(__dirname, '../supabase/migrations/20260218_create_snapai_insights.sql');
  let sqlContent;
  try {
    sqlContent = fs.readFileSync(sqlPath, 'utf8');
  } catch (err) {
    console.error(`❌ Failed to read SQL file: ${sqlPath}`, err);
    return;
  }

  console.log('📝 SQL to execute (preview):');
  console.log(sqlContent.substring(0, 200) + '...');

  // 尝试通过 RPC 执行 SQL (需要预先存在 exec_sql 函数)
  // 如果不存在，通常 Supabase JS 客户端无法直接执行 DDL
  // 除非使用了 supabase-cli 或者 postgres.js 直连数据库

  console.log('⚠️ Warning: supabase-js client cannot execute raw SQL directly unless an RPC function is exposed.');
  console.log('👉 Trying RPC "exec_sql"...');

  const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

  if (error) {
    console.error('❌ RPC execution failed:', error.message);
    console.log('💡 Tip: If you haven\'t set up an "exec_sql" function in Supabase, you must run the SQL manually in the Dashboard SQL Editor.');
    console.log(`\n📄 SQL File Path: ${sqlPath}`);
  } else {
    console.log('✅ Database setup successful via RPC!');
  }
}

setupDatabase();
