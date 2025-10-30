#!/usr/bin/env node

/**
 * 静态页面生成脚本
 * 用于为每个issue详情页生成静态页面并更新sitemap.xml
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 缺少Supabase环境变量');
  console.error('请确保设置了 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 项目根目录
const projectRoot = path.join(__dirname, '..');
const outDir = path.join(projectRoot, 'out');
const staticDir = path.join(outDir, 'issues');

/**
 * 从Supabase获取所有AI内容
 */
async function getAllAiContents() {
  try {
    console.log('📡 正在从Supabase获取所有AI内容...');
    
    const { data, error } = await supabase
      .from('n8n-ai-contents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch AI contents: ${error.message}`);
    }

    console.log(`✅ 成功获取 ${data.length} 条AI内容`);
    return data || [];
  } catch (error) {
    console.error('❌ 获取AI内容失败:', error);
    throw error;
  }
}

/**
 * 生成issue的静态HTML页面
 */
async function generateIssuePage(issue) {
  try {
    // 确保静态目录存在
    if (!fs.existsSync(staticDir)) {
      fs.mkdirSync(staticDir, { recursive: true });
    }

    // 格式化日期
    const date = new Date(issue.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    // 解析标签
    const tags = extractTagsFromContent(issue.tags);

    // 生成HTML内容
    const htmlContent = generateIssueHTML(issue, date, tags);

    // 写入文件
    const filePath = path.join(staticDir, `${issue.id}.html`);
    fs.writeFileSync(filePath, htmlContent, 'utf8');

    console.log(`✅ 生成页面: /issues/${issue.id}.html`);
    return `/issues/${issue.id}.html`;
  } catch (error) {
    console.error(`❌ 生成页面失败 ${issue.id}:`, error);
    return null;
  }
}

/**
 * 生成issue的HTML内容
 */
function generateIssueHTML(issue, date, tags) {
  const formattedContent = formatHtmlContent(issue.content);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';
  
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
    <link rel="canonical" href="${baseUrl}/issues/${issue.id}.html">
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
      console.warn('Failed to parse tags as JSON:', error);
    }
  }

  return ['ai', 'technology'];
}

/**
 * 生成sitemap.xml
 */
async function generateSitemap(urls) {
  try {
    console.log('🗺️ 正在生成sitemap.xml...');
    
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

    const sitemapPath = path.join(outDir, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap, 'utf8');
    
    console.log(`✅ 生成sitemap.xml: ${sitemapPath}`);
    console.log(`📊 包含 ${urls.length + 2} 个URL`);
  } catch (error) {
    console.error('❌ 生成sitemap.xml失败:', error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🚀 开始生成静态页面...');
    
    // 确保输出目录存在
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // 获取所有AI内容
    const issues = await getAllAiContents();
    
    if (issues.length === 0) {
      console.log('⚠️ 没有找到任何AI内容');
      return;
    }

    // 生成每个issue的静态页面
    const generatedUrls = [];
    for (const issue of issues) {
      const url = await generateIssuePage(issue);
      if (url) {
        generatedUrls.push(url);
      }
    }

    // 生成sitemap.xml
    await generateSitemap(generatedUrls);

    console.log('🎉 静态页面生成完成!');
    console.log(`📁 输出目录: ${outDir}`);
    console.log(`📄 生成了 ${generatedUrls.length} 个issue页面`);
    console.log(`🗺️ sitemap.xml已更新`);

  } catch (error) {
    console.error('❌ 生成过程失败:', error);
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
