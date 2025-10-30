#!/usr/bin/env node

/**
 * 静态页面生成使用示例
 * 演示如何使用静态生成脚本的各种功能
 */

const { execSync } = require('child_process');
const path = require('path');

// 颜色定义
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.cyan}🚀 ${description}${colors.reset}`);
  log(`${colors.yellow}执行命令: ${command}${colors.reset}`);
  
  try {
    execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    log(`${colors.green}✅ ${description} 完成${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ ${description} 失败: ${error.message}${colors.reset}`);
  }
}

function main() {
  log(`${colors.bright}${colors.magenta}📚 静态页面生成系统使用示例${colors.reset}`);
  log(`${colors.blue}这个示例将演示如何使用静态生成脚本的各种功能${colors.reset}`);
  
  // 检查环境变量
  log(`\n${colors.cyan}🔍 检查环境变量...${colors.reset}`);
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    log(`${colors.red}❌ 缺少 NEXT_PUBLIC_SUPABASE_URL 环境变量${colors.reset}`);
    log(`${colors.yellow}请设置 Supabase URL: export NEXT_PUBLIC_SUPABASE_URL=your_url${colors.reset}`);
    return;
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    log(`${colors.red}❌ 缺少 NEXT_PUBLIC_SUPABASE_ANON_KEY 环境变量${colors.reset}`);
    log(`${colors.yellow}请设置 Supabase Key: export NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key${colors.reset}`);
    return;
  }
  
  log(`${colors.green}✅ 环境变量检查通过${colors.reset}`);
  
  // 示例1: 基础静态生成
  log(`\n${colors.bright}${colors.blue}示例 1: 基础静态生成${colors.reset}`);
  runCommand('npm run generate-static', '基础静态页面生成');
  
  // 示例2: 高级静态生成
  log(`\n${colors.bright}${colors.blue}示例 2: 高级静态生成${colors.reset}`);
  runCommand('npm run generate-static-advanced', '高级静态页面生成（推荐）');
  
  // 示例3: 增量更新
  log(`\n${colors.bright}${colors.blue}示例 3: 增量更新${colors.reset}`);
  runCommand('npm run generate-static-incremental', '增量更新（只更新有变化的页面）');
  
  // 示例4: 强制更新
  log(`\n${colors.bright}${colors.blue}示例 4: 强制更新${colors.reset}`);
  runCommand('npm run generate-static-force', '强制更新所有页面');
  
  // 示例5: 构建并生成
  log(`\n${colors.bright}${colors.blue}示例 5: 完整构建流程${colors.reset}`);
  runCommand('npm run build-with-static-advanced', '构建Next.js应用并生成静态页面');
  
  // 示例6: 本地预览
  log(`\n${colors.bright}${colors.blue}示例 6: 本地预览${colors.reset}`);
  log(`${colors.yellow}启动本地预览服务器...${colors.reset}`);
  log(`${colors.cyan}访问 http://localhost:3001 查看生成的静态站点${colors.reset}`);
  log(`${colors.yellow}按 Ctrl+C 停止预览服务器${colors.reset}`);
  
  try {
    execSync('npm run preview-local', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  } catch (error) {
    log(`${colors.yellow}预览服务器已停止${colors.reset}`);
  }
  
  // 显示输出信息
  log(`\n${colors.bright}${colors.green}🎉 示例演示完成！${colors.reset}`);
  log(`${colors.blue}📁 生成的静态文件位于: out/ 目录${colors.reset}`);
  log(`${colors.blue}🗺️ sitemap.xml 已生成: out/sitemap.xml${colors.reset}`);
  log(`${colors.blue}📊 部署报告: out/deployment-report.txt${colors.reset}`);
  
  log(`\n${colors.bright}${colors.magenta}💡 下一步操作:${colors.reset}`);
  log(`${colors.yellow}1. 检查 out/ 目录中的生成文件${colors.reset}`);
  log(`${colors.yellow}2. 使用 npm run deploy-vercel 部署到Vercel${colors.reset}`);
  log(`${colors.yellow}3. 使用 npm run deploy-netlify 部署到Netlify${colors.reset}`);
  log(`${colors.yellow}4. 查看 scripts/README.md 获取详细说明${colors.reset}`);
}

// 运行示例
if (require.main === module) {
  main();
}

module.exports = { main };
