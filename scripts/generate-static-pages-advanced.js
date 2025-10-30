#!/usr/bin/env node

/**
 * 高级静态页面生成脚本
 * 支持增量更新、错误重试、进度显示等功能
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 配置
const CONFIG = {
  projectRoot: path.join(__dirname, '..'),
  outDir: 'out',
  staticDir: 'issues',
  maxRetries: 3,
  retryDelay: 1000,
  batchSize: 10,
  logLevel: process.env.LOG_LEVEL || 'info'
};

// 日志级别
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// 日志函数
function log(level, message, ...args) {
  if (LOG_LEVELS[level] <= LOG_LEVELS[CONFIG.logLevel]) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, ...args);
  }
}

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  log('error', '❌ 错误: 缺少Supabase环境变量');
  log('error', '请确保设置了 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 统计信息
const stats = {
  total: 0,
  generated: 0,
  skipped: 0,
  failed: 0,
  startTime: Date.now()
};

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试函数
 */
async function retry(fn, maxRetries = CONFIG.maxRetries, delayMs = CONFIG.retryDelay) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      log('warn', `重试 ${i + 1}/${maxRetries}: ${error.message}`);
      await delay(delayMs * (i + 1));
    }
  }
}

/**
 * 检查文件是否需要更新
 */
function needsUpdate(filePath, lastModified) {
  if (!fs.existsSync(filePath)) return true;
  
  const stats = fs.statSync(filePath);
  const fileTime = stats.mtime.getTime();
  const dataTime = new Date(lastModified).getTime();
  
  return dataTime > fileTime;
}

/**
 * 从Supabase获取所有AI内容（支持分页）
 */
async function getAllAiContents() {
  try {
    log('info', '📡 正在从Supabase获取所有AI内容...');
    
    let allData = [];
    let page = 0;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await retry(async () => {
        const { data, error } = await supabase
          .from('n8n-ai-contents')
          .select('*')
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        return { data, error };
      });

      if (error) throw error;

      if (data && data.length > 0) {
        allData = allData.concat(data);
        page++;
        hasMore = data.length === pageSize;
        log('debug', `已获取 ${allData.length} 条记录...`);
      } else {
        hasMore = false;
      }
    }

    log('info', `✅ 成功获取 ${allData.length} 条AI内容`);
    return allData;
  } catch (error) {
    log('error', '❌ 获取AI内容失败:', error);
    throw error;
  }
}

/**
 * 生成issue的静态HTML页面
 */
async function generateIssuePage(issue, options = {}) {
  const { force = false, checkUpdate = true } = options;
  
  try {
    const staticDir = path.join(CONFIG.projectRoot, CONFIG.outDir, CONFIG.staticDir);
    const filePath = path.join(staticDir, `${issue.id}.html`);
    
    // 检查是否需要更新
    if (checkUpdate && !force && !needsUpdate(filePath, issue.created_at)) {
      log('debug', `跳过 ${issue.id} (文件已是最新)`);
      stats.skipped++;
      return `/issues/${issue.id}.html`;
    }

    // 确保静态目录存在
    if (!fs.existsSync(staticDir)) {
      fs.mkdirSync(staticDir, { recursive: true });
    }

    // 生成HTML内容
    const htmlContent = await generateIssueHTML(issue);

    // 写入文件
    fs.writeFileSync(filePath, htmlContent, 'utf8');

    log('info', `✅ 生成页面: /issues/${issue.id}.html`);
    stats.generated++;
    return `/issues/${issue.id}.html`;
  } catch (error) {
    log('error', `❌ 生成页面失败 ${issue.id}:`, error);
    stats.failed++;
    return null;
  }
}

/**
 * 生成issue的HTML内容
 */
async function generateIssueHTML(issue) {
  // 格式化日期
  const date = new Date(issue.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // 解析标签
  const tags = extractTagsFromContent(issue.tags);
  const formattedContent = formatHtmlContent(issue.content);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(issue.title)} | AINews</title>
    <meta name="description" content="${escapeHtml(issue.summary)}">
    <meta property="og:title" content="${escapeHtml(issue.title)}">
    <meta property="og:description" content="${escapeHtml(issue.summary)}">
    <meta property="og:type" content="article">
    <meta property="og:published_time" content="${issue.created_at}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(issue.title)}">
    <meta name="twitter:description" content="${escapeHtml(issue.summary)}">
    <link rel="canonical" href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'}/issues/${issue.id}">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .title {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 10px;
            color: #1a1a1a;
        }
        .date {
            color: #666;
            font-size: 1.1rem;
            margin-bottom: 20px;
        }
        .summary {
            font-size: 1.2rem;
            color: #555;
            line-height: 1.8;
            margin-bottom: 30px;
        }
        .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 30px;
        }
        .tag {
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 0.9rem;
        }
        .content {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .content h1, .content h2, .content h3 {
            color: #1a1a1a;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        .content h1 { font-size: 2rem; }
        .content h2 { font-size: 1.5rem; }
        .content h3 { font-size: 1.2rem; }
        .content p {
            margin-bottom: 15px;
            line-height: 1.8;
        }
        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            color: #1976d2;
            text-decoration: none;
            font-weight: 500;
        }
        .back-link:hover {
            text-decoration: underline;
        }
        @media (max-width: 768px) {
            .title { font-size: 2rem; }
            .content { padding: 20px; }
        }
    </style>
</head>
<body>
    <a href="/" class="back-link">← 返回首页</a>
    
    <div class="header">
        <h1 class="title">${escapeHtml(issue.title)}</h1>
        <div class="date">${date}</div>
        <div class="summary">${escapeHtml(issue.summary)}</div>
        <div class="tags">
            ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
    </div>
    
    <div class="content">
        ${formattedContent.map(section => `
            <div id="${section.id}">
                <h2>${escapeHtml(section.title)}</h2>
                ${section.content}
            </div>
        `).join('')}
    </div>
</body>
</html>`;
}

/**
 * HTML转义函数
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 格式化HTML内容
 */
function formatHtmlContent(content) {
  if (!content) {
    return [{
      id: "main-content",
      title: "Content",
      content: "<p>No content available.</p>"
    }];
  }

  if (content.includes('<h') || content.includes('<p>') || content.includes('<div>')) {
    return [{
      id: "main-content",
      title: "Content",
      content: content
    }];
  }

  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  return [{
    id: "main-content",
    title: "Content",
    content: paragraphs.map(p => `<p>${escapeHtml(p.trim())}</p>`).join('\n')
  }];
}

/**
 * 从tags字段解析标签数组
 */
function extractTagsFromContent(tags) {
  if (!tags) {
    return ['ai', 'technology'];
  }

  if (Array.isArray(tags)) {
    return tags
      .filter(tag => tag && typeof tag === 'string' && tag.trim() !== '')
      .map(tag => tag.trim())
      .slice(0, 10);
  }

  if (typeof tags === 'string') {
    try {
      if (tags.trim().startsWith('[') && tags.trim().endsWith(']')) {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validTags = parsed
            .filter(tag => tag && typeof tag === 'string' && tag.trim() !== '')
            .map(tag => tag.trim())
            .slice(0, 10);
          
          if (validTags.length > 0) {
            return validTags;
          }
        }
      }
    } catch (error) {
      log('warn', 'Failed to parse tags as JSON:', error);
    }
  }

  return ['ai', 'technology'];
}

/**
 * 生成sitemap.xml
 */
async function generateSitemap(urls) {
  try {
    log('info', '🗺️ 正在生成sitemap.xml...');
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';
    const currentDate = new Date().toISOString();
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${baseUrl}/issues</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>
    ${urls.map(url => `
    <url>
        <loc>${baseUrl}${url}</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
    </url>`).join('')}
</urlset>`;

    const sitemapPath = path.join(CONFIG.projectRoot, CONFIG.outDir, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap, 'utf8');
    
    log('info', `✅ 生成sitemap.xml: ${sitemapPath}`);
    log('info', `📊 包含 ${urls.length + 2} 个URL`);
  } catch (error) {
    log('error', '❌ 生成sitemap.xml失败:', error);
    throw error;
  }
}

/**
 * 批量处理函数
 */
async function processBatch(items, processor, batchSize = CONFIG.batchSize) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    log('debug', `处理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`);
    
    const batchResults = await Promise.all(
      batch.map(item => processor(item))
    );
    
    results.push(...batchResults);
    
    // 批次间延迟，避免过载
    if (i + batchSize < items.length) {
      await delay(100);
    }
  }
  
  return results;
}

/**
 * 显示进度条
 */
function showProgress(current, total) {
  const percentage = Math.round((current / total) * 100);
  const barLength = 30;
  const filledLength = Math.round((barLength * current) / total);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  
  process.stdout.write(`\r进度: [${bar}] ${percentage}% (${current}/${total})`);
  
  if (current === total) {
    process.stdout.write('\n');
  }
}

/**
 * 显示统计信息
 */
function showStats() {
  const duration = Date.now() - stats.startTime;
  const durationSeconds = (duration / 1000).toFixed(2);
  
  log('info', '\n📊 生成统计:');
  log('info', `   总计: ${stats.total}`);
  log('info', `   生成: ${stats.generated}`);
  log('info', `   跳过: ${stats.skipped}`);
  log('info', `   失败: ${stats.failed}`);
  log('info', `   耗时: ${durationSeconds}秒`);
  
  if (stats.failed > 0) {
    log('warn', `⚠️ 有 ${stats.failed} 个页面生成失败`);
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    log('info', '🚀 开始生成静态页面...');
    
    // 解析命令行参数
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const incremental = args.includes('--incremental');
    
    if (force) {
      log('info', '🔄 强制更新模式');
    } else if (incremental) {
      log('info', '⚡ 增量更新模式');
    }

    // 确保输出目录存在
    const outDir = path.join(CONFIG.projectRoot, CONFIG.outDir);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // 获取所有AI内容
    const issues = await getAllAiContents();
    stats.total = issues.length;
    
    if (issues.length === 0) {
      log('warn', '⚠️ 没有找到任何AI内容');
      return;
    }

    // 生成每个issue的静态页面
    const generatedUrls = [];
    
    if (incremental && !force) {
      // 增量更新模式
      for (let i = 0; i < issues.length; i++) {
        const issue = issues[i];
        showProgress(i, issues.length);
        
        const url = await generateIssuePage(issue, { 
          force: false, 
          checkUpdate: true 
        });
        
        if (url) {
          generatedUrls.push(url);
        }
      }
    } else {
      // 批量处理模式
      const results = await processBatch(issues, async (issue) => {
        return await generateIssuePage(issue, { 
          force: force, 
          checkUpdate: !force 
        });
      });
      
      generatedUrls.push(...results.filter(url => url !== null));
    }

    // 生成sitemap.xml
    await generateSitemap(generatedUrls);

    // 显示统计信息
    showStats();

    log('info', '🎉 静态页面生成完成!');
    log('info', `📁 输出目录: ${outDir}`);
    log('info', `📄 生成了 ${generatedUrls.length} 个issue页面`);
    log('info', `🗺️ sitemap.xml已更新`);

  } catch (error) {
    log('error', '❌ 生成过程失败:', error);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  getAllAiContents,
  generateIssuePage,
  generateSitemap,
  main
};
