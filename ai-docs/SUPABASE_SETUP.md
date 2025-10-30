# Supabase 配置说明

## 环境变量设置

在项目根目录创建 `.env.local` 文件，并添加以下环境变量：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 获取 Supabase 配置信息

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目
3. 进入 Settings > API
4. 复制以下信息：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 数据库表结构

确保您的 Supabase 数据库中有 `n8n-ai-contents` 表，包含以下字段：

```sql
CREATE TABLE "n8n-ai-contents" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 权限设置

确保 `n8n-ai-contents` 表对匿名用户有读取权限：

1. 进入 Supabase Dashboard
2. 选择 Authentication > Policies
3. 为 `n8n-ai-contents` 表创建策略：

```sql
-- 允许匿名用户读取所有数据
CREATE POLICY "Allow anonymous read access" ON "n8n-ai-contents"
FOR SELECT USING (true);
```

## 测试连接

启动开发服务器后，访问首页检查是否成功从 Supabase 加载数据：

```bash
npm run dev
```

如果 Supabase 连接失败，组件会显示备用数据并显示相应的错误信息。

## 故障排除

### 常见问题

1. **环境变量未生效**
   - 确保 `.env.local` 文件在项目根目录
   - 重启开发服务器

2. **权限错误**
   - 检查 RLS (Row Level Security) 策略
   - 确保匿名用户有读取权限

3. **网络错误**
   - 检查 Supabase URL 是否正确
   - 确认网络连接正常

4. **表不存在**
   - 确认表名 `n8n-ai-contents` 正确
   - 检查字段名是否匹配
