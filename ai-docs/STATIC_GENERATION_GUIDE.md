# 静态页面生成快速指南

## 🚀 快速开始

### 1. 环境配置

首先设置必要的环境变量：

```bash
# 设置Supabase配置
export NEXT_PUBLIC_SUPABASE_URL="your_supabase_url_here"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key_here"

# 可选：设置网站URL（用于sitemap生成）
export NEXT_PUBLIC_SITE_URL="https://your-domain.com"
```

### 2. 基础使用

```bash
# 生成静态页面
npm run generate-static-advanced

# 构建并生成静态页面
npm run build-with-static-advanced

# 本地预览
npm run preview-local
```

### 3. 高级功能

```bash
# 增量更新（只更新有变化的页面）
npm run generate-static-incremental

# 强制更新所有页面
npm run generate-static-force

# 查看使用示例
npm run example
```

### 4. 部署

```bash
# 部署到Vercel
npm run deploy-vercel

# 部署到Netlify
npm run deploy-netlify

# 仅构建不部署
npm run deploy
```

## 📁 输出文件

生成的静态文件位于 `out/` 目录：

```
out/
├── issues/                    # 所有issue的静态HTML页面
│   ├── issue-1.html
│   ├── issue-2.html
│   └── ...
├── sitemap.xml               # 包含所有页面的sitemap
├── deployment-report.txt     # 部署报告
├── index.html               # 首页
├── issues.html              # issues列表页
└── ...                      # 其他Next.js静态文件
```

## 🎯 使用场景

### 场景1: 日常内容更新
```bash
# 使用增量更新，只更新有变化的内容
npm run generate-static-incremental
```

### 场景2: 完整重新生成
```bash
# 强制更新所有页面
npm run generate-static-force
```

### 场景3: 生产部署
```bash
# 构建并生成静态页面
npm run build-with-static-advanced

# 部署到云平台
npm run deploy-vercel
```

### 场景4: 本地开发测试
```bash
# 生成静态页面并启动本地预览
npm run preview-local
```

## 🔧 配置选项

### 环境变量

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase项目URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase匿名密钥 | `eyJhbGciOiJIUzI1NiIs...` |
| `NEXT_PUBLIC_SITE_URL` | ❌ | 网站URL（用于sitemap） | `https://your-domain.com` |
| `LOG_LEVEL` | ❌ | 日志级别 | `debug`, `info`, `warn`, `error` |

### 脚本参数

高级脚本支持以下参数：

```bash
# 增量更新模式
node scripts/generate-static-pages-advanced.js --incremental

# 强制更新模式
node scripts/generate-static-pages-advanced.js --force

# 调试模式
LOG_LEVEL=debug node scripts/generate-static-pages-advanced.js
```

## 📊 性能优化

### 增量更新
- 只更新有变化的页面，大幅提高生成速度
- 自动检测文件修改时间，跳过未更新的内容

### 批量处理
- 支持大量数据的批量处理
- 避免内存溢出，提高稳定性

### 错误重试
- 自动重试失败的页面生成
- 提高生成成功率

## 🐛 故障排除

### 常见问题

1. **Supabase连接失败**
   ```bash
   # 检查环境变量
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **权限错误**
   ```bash
   # 确保脚本有执行权限
   chmod +x scripts/*.sh
   chmod +x scripts/*.js
   ```

3. **内存不足**
   ```bash
   # 使用增量更新减少内存使用
   npm run generate-static-incremental
   ```

4. **生成失败**
   ```bash
   # 查看详细日志
   LOG_LEVEL=debug npm run generate-static-advanced
   ```

### 调试技巧

1. **查看生成日志**
   ```bash
   LOG_LEVEL=debug npm run generate-static-advanced
   ```

2. **检查输出文件**
   ```bash
   ls -la out/
   ls -la out/issues/
   ```

3. **验证sitemap**
   ```bash
   cat out/sitemap.xml
   ```

## 📚 更多信息

- **详细文档**: `scripts/README.md`
- **使用示例**: `npm run example`
- **项目文档**: `allaboutproject.md`
- **更新日志**: `changelog.md`

## 🆘 获取帮助

如果遇到问题，请：

1. 查看 `scripts/README.md` 获取详细说明
2. 运行 `npm run example` 查看使用示例
3. 检查 `out/deployment-report.txt` 查看生成报告
4. 使用 `LOG_LEVEL=debug` 获取详细日志
