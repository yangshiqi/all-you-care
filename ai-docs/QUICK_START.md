# 快速开始指南

## 🚀 5分钟部署到Vercel

### 1. 设置环境变量

```bash
export NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_key"
export NEXT_PUBLIC_SITE_URL="https://your-domain.vercel.app"
```

### 2. 测试构建

```bash
npm run test-build
```

### 3. 部署到Vercel

```bash
npm run vercel-deploy
```

就这么简单！🎉

---

## 📋 常用命令

### 开发
```bash
npm run dev                          # 启动开发服务器
```

### 构建
```bash
npm run build                        # 构建Next.js应用
npm run test-build                   # 测试构建
npm run build-with-static-advanced   # 构建并生成静态页面
```

### 静态生成
```bash
npm run generate-static-advanced     # 生成静态页面
npm run generate-static-incremental  # 增量更新
npm run generate-static-force        # 强制更新所有页面
```

### 预览
```bash
npm run preview-local                # 本地预览
npm run test-vercel                  # 测试Vercel配置
```

### 部署
```bash
npm run vercel-deploy                # 部署到Vercel
npm run deploy-netlify               # 部署到Netlify
```

---

## 🔧 故障排除

### 问题: 构建失败
```bash
# 检查环境变量
echo $NEXT_PUBLIC_SUPABASE_URL

# 清理并重新构建
rm -rf .next out
npm run build
```

### 问题: 静态页面未生成
```bash
# 重新生成
npm run generate-static-force

# 检查输出
ls -la out/issues/
```

### 问题: Vercel部署失败
```bash
# 测试配置
npm run test-vercel

# 查看详细日志
vercel --debug
```

---

## 📚 详细文档

- **构建问题**: `BUILD_FIX_SUMMARY.md`
- **Vercel部署**: `VERCEL_DEPLOYMENT.md`
- **静态生成**: `STATIC_GENERATION_GUIDE.md`
- **完整文档**: `allaboutproject.md`

---

## 🎯 部署后验证

1. 访问首页: `https://your-domain.vercel.app/`
2. 检查sitemap: `https://your-domain.vercel.app/sitemap.xml`
3. 测试issue页面: `https://your-domain.vercel.app/issues/1.html`

---

## 💡 提示

- 使用 `npm run test-build` 在部署前测试
- 使用 `npm run generate-static-incremental` 进行日常更新
- 定期检查 `out/` 目录确认文件生成正确
- 在Vercel控制台查看构建日志

---

**需要帮助？** 查看相关文档或运行 `npm run example` 查看使用示例。
