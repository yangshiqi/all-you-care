# Vercel 静态部署指南

## 🚀 快速部署

### 1. 环境配置

在Vercel项目设置中配置环境变量：

```bash
# 必需的环境变量
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# 可选：设置您的域名
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### 2. 部署配置

项目已包含 `vercel.json` 配置文件，确保静态文件正确路由：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "out/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/sitemap.xml",
      "dest": "/out/sitemap.xml"
    },
    {
      "src": "/issues/(.*)",
      "dest": "/out/issues/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/out/$1"
    }
  ]
}
```

### 3. 构建命令

在Vercel项目设置中配置构建命令：

```bash
# 构建命令
npm run build-with-static-advanced

# 输出目录
out
```

## 📁 文件结构

部署后的文件结构：

```
your-domain.vercel.app/
├── /                    # 首页
├── /issues             # issues列表页
├── /sitemap.xml        # sitemap文件
└── /issues/
    ├── 1.html          # issue详情页
    ├── 2.html
    └── ...
```

## 🔗 URL访问

部署后，您可以通过以下URL访问：

- **首页**: `https://your-domain.vercel.app/`
- **Issues列表**: `https://your-domain.vercel.app/issues`
- **Sitemap**: `https://your-domain.vercel.app/sitemap.xml`
- **Issue详情**: `https://your-domain.vercel.app/issues/1.html`

## ⚙️ 部署步骤

### 方法1: Vercel CLI

```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 部署
vercel --prod
```

### 方法2: GitHub集成

1. 将代码推送到GitHub仓库
2. 在Vercel控制台连接GitHub仓库
3. 配置环境变量
4. 自动部署

### 方法3: 手动上传

1. 运行构建命令：`npm run build-with-static-advanced`
2. 将 `out/` 目录内容上传到Vercel
3. 配置路由规则

## 🔧 配置说明

### vercel.json 配置详解

```json
{
  "version": 2,
  "builds": [
    {
      "src": "out/**/*",           // 构建所有out目录下的文件
      "use": "@vercel/static"      // 使用静态文件处理
    }
  ],
  "routes": [
    {
      "src": "/sitemap.xml",       // sitemap.xml路由
      "dest": "/out/sitemap.xml"
    },
    {
      "src": "/issues/(.*)",       // issues目录路由
      "dest": "/out/issues/$1"
    },
    {
      "src": "/(.*)",              // 其他文件路由
      "dest": "/out/$1"
    }
  ],
  "headers": [
    {
      "source": "/sitemap.xml",    // sitemap缓存头
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/xml"
        }
      ]
    }
  ]
}
```

## 📊 性能优化

### 缓存策略

- **sitemap.xml**: 1小时缓存
- **HTML页面**: 24小时缓存
- **静态资源**: 长期缓存

### CDN加速

Vercel自动提供全球CDN加速，确保快速访问。

## 🐛 故障排除

### 常见问题

1. **404错误**
   - 检查 `vercel.json` 路由配置
   - 确认文件路径正确

2. **环境变量未生效**
   - 在Vercel控制台重新设置环境变量
   - 重新部署项目

3. **构建失败**
   - 检查Supabase连接
   - 查看构建日志

4. **sitemap无法访问**
   - 确认 `vercel.json` 中的sitemap路由配置
   - 检查文件是否生成

### 调试步骤

1. **本地测试**
   ```bash
   npm run build-with-static-advanced
   npm run preview-local
   ```

2. **检查文件**
   ```bash
   ls -la out/
   ls -la out/issues/
   cat out/sitemap.xml
   ```

3. **验证URL**
   - 访问 `http://localhost:3001/sitemap.xml`
   - 访问 `http://localhost:3001/issues/1.html`

## 🔄 自动更新

### 设置自动部署

1. 在Vercel控制台启用GitHub集成
2. 设置环境变量
3. 每次推送代码时自动部署

### 定时更新内容

可以使用GitHub Actions设置定时任务：

```yaml
name: Update Static Content
on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨2点
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build-with-static-advanced
      - run: git add out/
      - run: git commit -m "Update static content" || exit 0
      - run: git push
```

## 📈 监控和分析

### Vercel Analytics

- 启用Vercel Analytics查看访问统计
- 监控页面加载性能
- 分析用户行为

### SEO监控

- 使用Google Search Console验证sitemap
- 监控搜索排名
- 检查页面索引状态

## 🎯 最佳实践

1. **定期更新**: 设置自动更新机制
2. **监控性能**: 使用Vercel Analytics
3. **SEO优化**: 定期检查sitemap和meta标签
4. **错误处理**: 设置错误监控和告警
5. **备份策略**: 定期备份生成的文件

---

**部署完成后，您的静态站点将可以通过以下URL访问：**
- 首页: `https://your-domain.vercel.app/`
- Sitemap: `https://your-domain.vercel.app/sitemap.xml`
- Issue页面: `https://your-domain.vercel.app/issues/[id].html`
