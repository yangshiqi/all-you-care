# Next.js 静态导出修复指南

## 问题描述

当使用 `output: 'export'` 配置时，Next.js要求所有动态路由页面必须导出 `generateStaticParams()` 函数。

### 常见错误

**错误1: 缺少 generateStaticParams 函数**
```
Runtime Error
Page "/issues/[slug]/page" is missing exported function "generateStaticParams()", 
which is required with "output: export" config.
```

**错误2: 参数类型错误**
```
Runtime Error
A required parameter (slug) was not provided as a string received number 
in generateStaticParams for /issues/[slug]
```

## 解决方案

已在 `src/app/issues/[slug]/page.tsx` 中添加 `generateStaticParams()` 函数：

```typescript
// 生成静态参数 - Next.js静态导出必需
export async function generateStaticParams() {
  try {
    // 从Supabase获取所有AI内容
    const contents = await getAllAiContents();
    
    // 返回所有slug参数（确保转换为字符串）
    return contents.map((content) => ({
      slug: String(content.id),  // ⚠️ 重要：必须转换为字符串
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    // 返回空数组，避免构建失败
    return [];
  }
}
```

### 关键点

1. **类型转换**: 所有参数必须是字符串类型，使用 `String()` 转换
2. **数据库ID**: 如果数据库中的ID是数字，必须转换为字符串
3. **类型一致性**: 确保 `generateStaticParams()` 返回的类型与路由参数类型一致

## 工作原理

1. **构建时执行**: Next.js在构建时调用 `generateStaticParams()`
2. **获取所有ID**: 从Supabase获取所有issue的ID
3. **生成静态页面**: 为每个ID生成对应的静态HTML页面
4. **错误处理**: 如果获取失败，返回空数组避免构建中断

## 现在可以正常构建

```bash
# 构建Next.js应用
npm run build

# 构建并生成静态页面
npm run build-with-static-advanced

# 部署到Vercel
npm run vercel-deploy
```

## 验证修复

运行以下命令验证构建是否成功：

```bash
# 清理旧文件
rm -rf .next out

# 重新构建
npm run build

# 检查输出
ls -la .next/
```

## 相关配置

### next.config.ts
```typescript
const nextConfig: NextConfig = {
  output: 'export',  // 启用静态导出
  trailingSlash: true,
  // ... 其他配置
};
```

### 动态路由要求

所有使用动态参数的路由（如 `[slug]`, `[id]` 等）都必须：

1. 导出 `generateStaticParams()` 函数
2. 返回所有可能的参数组合
3. 在构建时生成所有静态页面

## 注意事项

1. **数据获取**: `generateStaticParams()` 在构建时执行，需要能够访问数据源
2. **环境变量**: 确保构建时环境变量已正确设置
3. **错误处理**: 添加错误处理避免构建失败
4. **性能考虑**: 如果数据量很大，考虑分页或限制数量

## 故障排除

### 问题1: 构建时无法连接Supabase

**解决方案**: 确保环境变量已设置
```bash
export NEXT_PUBLIC_SUPABASE_URL="your_url"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your_key"
```

### 问题2: 生成的页面数量不对

**解决方案**: 检查 `getAllAiContents()` 函数返回的数据
```bash
# 测试数据获取
node -e "require('./src/lib/api').getAllAiContents().then(d => console.log(d.length))"
```

### 问题3: 构建成功但页面404

**解决方案**: 检查路由配置和文件路径
- 确认 `vercel.json` 路由配置正确
- 检查生成的文件是否在正确的位置

## 更多信息

- [Next.js静态导出文档](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [generateStaticParams文档](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)
- 项目文档: `VERCEL_DEPLOYMENT.md`
