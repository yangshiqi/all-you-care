#!/usr/bin/env node

/**
 * Vercel部署测试脚本
 * 用于测试静态文件是否正确生成和配置
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    log(`✅ ${description}: ${filePath} (${(stats.size / 1024).toFixed(2)}KB)`, 'green');
    return true;
  } else {
    log(`❌ ${description}: ${filePath} 不存在`, 'red');
    return false;
  }
}

function checkDirectory(dirPath, description) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    log(`✅ ${description}: ${dirPath} (${files.length} 个文件)`, 'green');
    return true;
  } else {
    log(`❌ ${description}: ${dirPath} 不存在`, 'red');
    return false;
  }
}

function validateSitemap(sitemapPath) {
  try {
    const content = fs.readFileSync(sitemapPath, 'utf8');
    
    // 检查XML格式
    if (!content.includes('<?xml version="1.0" encoding="UTF-8"?>')) {
      log('❌ sitemap.xml 格式错误：缺少XML声明', 'red');
      return false;
    }
    
    if (!content.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
      log('❌ sitemap.xml 格式错误：缺少urlset声明', 'red');
      return false;
    }
    
    // 统计URL数量
    const urlMatches = content.match(/<url>/g);
    const urlCount = urlMatches ? urlMatches.length : 0;
    
    log(`✅ sitemap.xml 格式正确，包含 ${urlCount} 个URL`, 'green');
    return true;
  } catch (error) {
    log(`❌ 读取sitemap.xml失败: ${error.message}`, 'red');
    return false;
  }
}

function validateHtmlFile(htmlPath) {
  try {
    const content = fs.readFileSync(htmlPath, 'utf8');
    
    // 检查基本HTML结构
    if (!content.includes('<!DOCTYPE html>')) {
      log(`❌ ${htmlPath} 格式错误：缺少DOCTYPE声明`, 'red');
      return false;
    }
    
    if (!content.includes('<html lang="en">')) {
      log(`❌ ${htmlPath} 格式错误：缺少html标签`, 'red');
      return false;
    }
    
    if (!content.includes('<title>')) {
      log(`❌ ${htmlPath} 格式错误：缺少title标签`, 'red');
      return false;
    }
    
    if (!content.includes('<meta name="description"')) {
      log(`❌ ${htmlPath} 格式错误：缺少description meta标签`, 'red');
      return false;
    }
    
    log(`✅ ${htmlPath} HTML格式正确`, 'green');
    return true;
  } catch (error) {
    log(`❌ 读取${htmlPath}失败: ${error.message}`, 'red');
    return false;
  }
}

function checkVercelConfig() {
  const vercelJsonPath = path.join(__dirname, '..', 'vercel.json');
  
  if (!fs.existsSync(vercelJsonPath)) {
    log('❌ vercel.json 配置文件不存在', 'red');
    return false;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    
    // 检查基本配置
    if (!config.builds || !Array.isArray(config.builds)) {
      log('❌ vercel.json 配置错误：缺少builds配置', 'red');
      return false;
    }
    
    if (!config.routes || !Array.isArray(config.routes)) {
      log('❌ vercel.json 配置错误：缺少routes配置', 'red');
      return false;
    }
    
    // 检查sitemap路由
    const sitemapRoute = config.routes.find(route => route.src === '/sitemap.xml');
    if (!sitemapRoute) {
      log('❌ vercel.json 配置错误：缺少sitemap.xml路由', 'red');
      return false;
    }
    
    // 检查issues路由
    const issuesRoute = config.routes.find(route => route.src === '/issues/(.*)');
    if (!issuesRoute) {
      log('❌ vercel.json 配置错误：缺少issues路由', 'red');
      return false;
    }
    
    log('✅ vercel.json 配置正确', 'green');
    return true;
  } catch (error) {
    log(`❌ 解析vercel.json失败: ${error.message}`, 'red');
    return false;
  }
}

function generateTestUrls(baseUrl) {
  const outDir = path.join(__dirname, '..', 'out');
  const issuesDir = path.join(outDir, 'issues');
  
  const urls = [
    `${baseUrl}/`,
    `${baseUrl}/sitemap.xml`
  ];
  
  if (fs.existsSync(issuesDir)) {
    const files = fs.readdirSync(issuesDir).filter(file => file.endsWith('.html'));
    files.forEach(file => {
      urls.push(`${baseUrl}/issues/${file}`);
    });
  }
  
  return urls;
}

function main() {
  log(`${colors.bright}${colors.magenta}🧪 Vercel部署测试${colors.reset}`);
  log(`${colors.blue}检查静态文件生成和配置是否正确${colors.reset}\n`);
  
  const outDir = path.join(__dirname, '..', 'out');
  const issuesDir = path.join(outDir, 'issues');
  const sitemapPath = path.join(outDir, 'sitemap.xml');
  
  let allPassed = true;
  
  // 1. 检查输出目录
  log(`${colors.cyan}📁 检查输出目录...${colors.reset}`);
  allPassed &= checkDirectory(outDir, '输出目录');
  allPassed &= checkDirectory(issuesDir, 'Issues目录');
  
  // 2. 检查sitemap.xml
  log(`\n${colors.cyan}🗺️ 检查sitemap.xml...${colors.reset}`);
  allPassed &= checkFile(sitemapPath, 'sitemap.xml文件');
  if (fs.existsSync(sitemapPath)) {
    allPassed &= validateSitemap(sitemapPath);
  }
  
  // 3. 检查HTML文件
  log(`\n${colors.cyan}📄 检查HTML文件...${colors.reset}`);
  if (fs.existsSync(issuesDir)) {
    const htmlFiles = fs.readdirSync(issuesDir).filter(file => file.endsWith('.html'));
    
    if (htmlFiles.length === 0) {
      log('⚠️ 没有找到HTML文件', 'yellow');
      allPassed = false;
    } else {
      log(`找到 ${htmlFiles.length} 个HTML文件`);
      
      // 检查前3个文件
      htmlFiles.slice(0, 3).forEach(file => {
        const filePath = path.join(issuesDir, file);
        allPassed &= validateHtmlFile(filePath);
      });
      
      if (htmlFiles.length > 3) {
        log(`... 还有 ${htmlFiles.length - 3} 个文件未检查`, 'blue');
      }
    }
  }
  
  // 4. 检查Vercel配置
  log(`\n${colors.cyan}⚙️ 检查Vercel配置...${colors.reset}`);
  allPassed &= checkVercelConfig();
  
  // 5. 生成测试URL
  log(`\n${colors.cyan}🔗 生成测试URL...${colors.reset}`);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.vercel.app';
  const testUrls = generateTestUrls(baseUrl);
  
  log(`部署后可通过以下URL访问：`, 'blue');
  testUrls.forEach(url => {
    log(`  ${url}`, 'cyan');
  });
  
  // 6. 总结
  log(`\n${colors.bright}${colors.magenta}📊 测试结果${colors.reset}`);
  
  if (allPassed) {
    log('🎉 所有检查通过！可以部署到Vercel', 'green');
    log('\n💡 下一步操作：', 'blue');
    log('1. 运行 npm run vercel-deploy 部署到Vercel', 'yellow');
    log('2. 或使用 Vercel CLI: vercel --prod', 'yellow');
    log('3. 或连接GitHub仓库进行自动部署', 'yellow');
  } else {
    log('❌ 部分检查失败，请修复问题后重试', 'red');
    log('\n🔧 修复建议：', 'blue');
    log('1. 运行 npm run generate-static-advanced 重新生成文件', 'yellow');
    log('2. 检查环境变量是否正确设置', 'yellow');
    log('3. 检查Supabase连接是否正常', 'yellow');
  }
  
  log(`\n📚 更多信息请查看 VERCEL_DEPLOYMENT.md`, 'blue');
}

// 运行测试
if (require.main === module) {
  main();
}

module.exports = { main };
