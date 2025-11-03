## 2025-01-XX
- feat(content): 在获取 issues 详情页信息时，从 Supabase 中获取的 content 数据只提取 `<body>` 标签内的内容（不包括 body 标签本身）。
- refactor(html): 新增 `extractBodyContent` 函数用于从 HTML 中提取 body 标签内的内容。
- fix(parsing): 优化 `formatHtmlContent` 函数，确保只处理 body 标签内的 HTML 内容，提升内容解析的准确性。
- feat(filter): 新增 `removeTagsSection` 函数，从 content 中过滤掉 tags 相关的 section。
  - 自动移除包含 `class="tags"` 的容器元素（div, section, aside 等）
  - 自动移除包含 `id="tags"` 或 `id="tag"` 的元素
  - 自动移除包含 `class="tag"` 的单个标签元素
  - 自动移除包含"相关标签"或"Related Tags"文本的 section 元素（如 `<section><h2>相关标签</h2></section>` 或 `<section><h2>Related Tags</h2></section>`）
  - 支持循环处理嵌套的 tags 结构，确保完全移除所有相关元素
- feat(style): 大幅增强 issues 详情页的内容展示样式，提升可读性和视觉层次。
  - **标题样式**: h2 添加左侧边框强调，h3 添加背景色块突出显示，h4 优化颜色和字重
  - **文章卡片**: article 标签添加背景色、左侧边框和悬停效果，增强内容区块的视觉识别
  - **标签系统**: 为 `.tags` 和 `.tag` 添加完整样式，包括悬停交互效果
  - **摘要样式**: `.summary` 类添加背景和边框，突出显示重要摘要内容
  - **列表增强**: 优化 ul/ol 样式，标记颜色与主题色统一
  - **链接优化**: 添加下划线和悬停背景高亮效果，提升交互体验
  - **引用样式**: blockquote 添加左侧边框和背景，增强引用内容的识别度
  - **代码样式**: code 和 pre 标签添加背景、边框和圆角，提升代码展示效果
  - **保持风格**: 所有样式均使用现有配色方案（primary, secondary, border 等 CSS 变量），完美契合复古报纸风格

## 2025-10-30
- feat(tags): 新增按标签访问功能 `/tags/[tag]`，支持根据标签筛选包含该标签的内容。
- feat(tags): 新增所有标签列表页面 `/tags`，展示所有可用标签及其文章数量统计。
- feat(seo): 为标签页面生成动态 `title/description` 元数据以提升SEO。
- feat(static): 实现 `generateStaticParams` 函数，支持 Next.js 静态导出（`output: 'export'`）。
- feat(nav): 在 Header 导航中启用标签链接。
- feat(i18n): 为标签页面添加中英文翻译支持。
- fix(links): 为所有标签链接添加 URL 编码（`encodeURIComponent`），确保特殊字符正确处理。
- fix(calendar): 修复 Calendar 组件以适配新版本的 `react-day-picker` API。
- deps: 安装缺失依赖（`embla-carousel-react`、`react-day-picker`、`recharts`）。
- docs: 新增 `ai-docs/tags-page-implementation-2025-10-30.md` 记录实现方案与技术细节。

## 2025-10-29
- feat(i18n/supabase): 为 Supabase `n8n-ai-contents` 接口增加语言过滤能力（`lang: en|zh_CN`），并在 `RecentIssues` 和 `IssuesList` 依据 `i18n.language` 传入过滤参数。
- refactor(types): `N8nAiContent` 增加可选字段 `lang`。
- feat(i18n): 为 `IssuesList` 组件添加完整的国际化支持，包括所有文本的翻译。
- docs: 新增 `ai-docs/supabase-lang-filter-2025-10-29.md` 记录实现细节与后续建议。
# 更新日志

## [2025-10-29] - 推荐语内容更新

### 🎯 内容优化
- **推荐语更新**: 更换首页的四个用户推荐语，突出AI信息管理的核心价值
- **主题聚焦**: 强调在AI快速发展中进行知识压缩和信息筛选的重要性
- **用户痛点**: 突出解决信息过载与及时更新之间的平衡问题
- **双语更新**: 同步更新中英文版本的推荐内容

### ✨ 新推荐语
**中文版本**:
1. **Alex Chen**: "在AI领域，每天都有新突破。这个平台帮我快速筛选真正重要的信息"
2. **Sarah Kim**: "信息过载是AI工程师最大的挑战，这里的内容压缩让我保持领先"
3. **David Liu**: "不需要翻遍所有论坛，这里已经为我做了最好的总结"
4. **Emma Wang**: "在快速变化的AI世界，这是我保持更新的秘密武器"

**英文版本**:
1. **Alex Chen**: "In AI, breakthroughs happen daily. This platform helps me filter what truly matters"
2. **Sarah Kim**: "Information overload is the biggest challenge for AI engineers, This digest keeps me ahead of the curve"
3. **David Liu**: "No need to scroll through endless forums, the best summaries are already here"
4. **Emma Wang**: "In the fast-moving AI world, this is my secret weapon to stay updated"

### 🎨 内容特点
- **信息筛选**: 强调快速筛选重要信息的能力
- **内容压缩**: 突出知识概览和压缩的价值
- **时间节省**: 不需要翻遍各个论坛和平台
- **保持领先**: 在快速变化中保持更新和竞争力

### 📝 修改文件
- `src/lib/locales/zh_CN.ts` - 更新中文推荐语
- `src/lib/locales/en.ts` - 更新英文推荐语

## [2025-10-29] - Header Logo 更新

### 🎨 视觉更新
- **新Logo设计**: 将Header中的品牌标识更新为火焰图标 + "All you care" 文字组合
- **SVG图标**: 使用自定义SVG火焰图标替代原有的文字logo
- **色调统一**: Logo颜色使用 `currentColor`，自动匹配网站的黑白色调主题
- **交互效果**: 添加hover悬停效果，logo图标微缩放，整体透明度变化

### ✨ 设计特性
- **图标尺寸**: 40x40px 的火焰图标
- **文字样式**: 粗体、2xl大小、大写字母、宽字距
- **组合布局**: 使用flex布局，图标与文字间隔3个单位
- **响应式**: 图标在悬停时轻微放大(scale-105)
- **品牌更新**: 从"AINews"更新为"All you care"

### 🔧 技术实现
- **SVG内联**: 直接在组件中内联SVG代码，无需额外资源加载
- **主题适配**: 使用 `text-primary` 和 `currentColor`，完美适配主题色
- **动画过渡**: 使用 Tailwind 的 transition 类实现流畅动画
- **分组效果**: 使用 `group` 和 `group-hover` 实现组合hover效果

## [2024-10-29] - Next.js静态导出修复

### 🐛 问题修复
- **generateStaticParams**: 为动态路由页面添加必需的 `generateStaticParams()` 函数
- **类型转换**: 修复参数类型错误，确保slug为字符串类型
- **静态导出兼容**: 修复 `output: 'export'` 配置下的构建错误
- **动态路由**: 确保所有issue详情页能够正确生成静态页面

### 🔧 技术改进
- 在 `src/app/issues/[slug]/page.tsx` 中添加 `generateStaticParams()` 函数
- 使用 `String()` 将数据库ID转换为字符串类型
- 从Supabase获取所有AI内容ID作为静态参数
- 添加错误处理，避免构建失败

### 📝 相关修改
- 导入 `getAllAiContents` 函数
- 生成所有issue的slug参数列表（字符串类型）
- 确保Next.js知道需要生成哪些静态页面
- 修复类型不匹配问题（number → string）

## [2024-12-19] - 静态页面生成系统

### 🎉 重大更新
- **静态生成**: 完整的静态页面生成系统，支持从Supabase数据生成静态HTML页面
- **SEO优化**: 每个静态页面包含完整的meta标签、Open Graph和Twitter Card
- **自动化部署**: 支持Vercel、Netlify等平台的自动化部署
- **增量更新**: 支持只更新有变化的页面，大幅提高生成效率

### ✨ 新功能
- **基础生成脚本**: `scripts/generate-static-pages.js` - 简单易用的静态页面生成
- **高级生成脚本**: `scripts/generate-static-pages-advanced.js` - 支持增量更新、批量处理、错误重试
- **部署脚本**: `scripts/deploy-static.sh` - 完整的构建和部署自动化流程
- **sitemap生成**: 自动生成包含所有页面的sitemap.xml
- **响应式设计**: 生成的静态页面完美适配移动端和桌面端

### 🔧 技术改进
- **Next.js配置**: 更新配置支持静态导出 (`output: 'export'`)
- **批量处理**: 支持大量数据的批量处理，避免内存溢出
- **错误重试**: 自动重试失败的页面生成，提高成功率
- **进度显示**: 实时显示生成进度和统计信息
- **日志系统**: 可配置的日志级别，便于调试和监控

### 📦 脚本命令
```bash
# 基础静态生成
npm run generate-static

# 高级静态生成（推荐）
npm run generate-static-advanced

# 增量更新（只更新有变化的页面）
npm run generate-static-incremental

# 强制更新所有页面
npm run generate-static-force

# 构建并生成静态页面
npm run build-with-static-advanced

# 本地预览
npm run preview-local

# 部署到Vercel
npm run deploy-vercel

# 部署到Netlify
npm run deploy-netlify
```

### 📊 输出结构
```
out/
├── issues/           # 所有issue的静态HTML页面
│   ├── issue-1.html
│   ├── issue-2.html
│   └── ...
├── sitemap.xml       # 包含所有页面的sitemap
├── deployment-report.txt  # 部署报告
└── ...              # Next.js导出的其他文件
```

### 🎨 页面特性
- **完整SEO**: 每个页面包含title、description、Open Graph、Twitter Card
- **响应式设计**: 移动端和桌面端完美适配
- **复古风格**: 保持项目的复古报纸风格
- **快速加载**: 静态HTML确保极快的加载速度
- **搜索引擎友好**: 完整的结构化数据和元数据

### 📝 文档更新
- **脚本说明**: 详细的脚本使用说明和配置指南
- **部署指南**: 完整的部署流程和故障排除
- **项目文档**: 更新allaboutproject.md记录新功能

## [2024-12-19] - Issue详情页Summary展示优化

### ✨ 功能增强
- **Summary展示**: 在issue详情页的tags区域下方添加summary展示
- **布局优化**: 将summary从独立区域移动到tags区域内，形成更紧凑的布局
- **视觉分离**: 使用边框分隔线区分tags和summary区域
- **多语言支持**: 为summary区域添加中英文翻译支持

### 🎨 UI/UX改进
- **区域整合**: summary现在作为tags区域的一部分显示
- **条件渲染**: 只有当summary存在时才显示summary区域
- **样式统一**: 使用与tags相同的视觉风格和间距
- **响应式设计**: 保持在不同屏幕尺寸下的良好显示效果

### 🌐 国际化更新
- **中文翻译**: 添加"摘要"翻译
- **英文翻译**: 添加"Summary"翻译
- **翻译键**: 使用`issueDetail.summary`作为翻译键

## [2024-12-19] - 标签数据源修正

### 🎯 重要修正
- **数据源修正**: 修正标签提取逻辑，直接从 Supabase `tags` 字段获取标签数据
- **移除错误逻辑**: 不再从 `summary` 字段提取标签，直接使用 `tags` 字段
- **数据完整性**: 确保标签数据来源的准确性和一致性
- **全站统一**: 修正列表页和详情页的标签展示逻辑

### ✨ 功能优化
- **直接使用**: 直接使用 Supabase 中存储的 `tags` 字段数据
- **格式支持**: 支持数组格式和JSON字符串格式的标签数据
- **类型处理**: 智能处理数组和字符串两种数据格式
- **错误处理**: 完善的错误处理和降级机制
- **统一函数**: 所有页面使用统一的 `extractTagsFromContent` 函数

### 🔧 技术改进
- **数据源**: 从 `item.tags` 字段直接获取标签数据
- **格式检测**: 自动检测数据类型（数组 vs 字符串）
- **JSON解析**: 对字符串格式的标签进行JSON解析
- **数据验证**: 过滤空值和无效标签
- **默认值**: 解析失败时使用默认标签
- **类型定义**: 在 `N8nAiContent` 接口中添加 `tags` 字段
- **函数导出**: 将 `extractTagsFromContent` 函数导出供其他组件使用

### 📊 数据处理流程
- **Supabase查询**: 包含 `tags` 字段的数据查询
- **类型检查**: 检查 `tags` 是数组还是字符串
- **格式解析**: 字符串格式使用JSON.parse()解析
- **数据清理**: 过滤和验证标签数据
- **结果返回**: 返回最多10个有效标签

### 🎨 页面修正
- **列表页**: IssuesList 组件使用新的标签提取逻辑
- **详情页**: IssueDetailPage 的 generateTagCategories 函数使用 tags 字段
- **首页**: RecentIssues 组件已使用正确的标签逻辑

## [2024-12-19] - 首页时间范围调整

### 🎯 功能调整
- **时间范围**: 将首页"AI行业最近30天"调整为"AI行业最近7天"
- **数据筛选**: API逻辑更新，只显示最近7天内的内容
- **排序优化**: 确保按时间倒序排列显示

### ✨ 具体修改
- **中文标题**: "AI行业最近30天" → "AI行业最近7天"
- **英文标题**: "Last 30 days in AI" → "Last 7 days in AI"
- **API逻辑**: 添加7天时间范围筛选条件
- **数据获取**: 使用 `gte('created_at', sevenDaysAgoISO)` 筛选最近7天数据

### 🔧 技术改进
- **时间计算**: 动态计算7天前的日期范围
- **查询优化**: 在数据库层面进行时间筛选，提升性能
- **排序保持**: 维持按创建时间倒序排列

## [2024-12-19] - Issues 列表页 Supabase 集成

### 🎉 重大更新
- **列表页数据源**: Issues 列表页完全使用 Supabase 数据
- **客户端数据获取**: 使用 React hooks 进行客户端数据管理
- **实时搜索**: 支持按标题、摘要和标签进行实时搜索过滤

### ✨ 新功能
- **动态数据加载**: 从 Supabase 获取所有期刊数据
- **智能标签提取**: 从摘要内容自动提取相关标签
- **加载状态**: 优雅的加载动画和错误提示
- **备用数据**: 连接失败时自动使用备用数据

### 🔧 技术改进
- **客户端数据获取**: 使用 useEffect 和 useState 管理数据状态
- **错误处理**: 完善的错误处理和用户友好的提示
- **性能优化**: 客户端缓存和状态管理
- **类型安全**: 完整的 TypeScript 类型定义

### 📊 数据流程
- **列表页**: Supabase → 客户端 → 动态渲染
- **搜索过滤**: 客户端实时过滤和搜索
- **标签生成**: 自动从内容中提取标签

### 🎨 用户体验
- **响应式搜索**: 实时搜索和过滤功能
- **加载反馈**: 清晰的加载状态和错误提示
- **一致设计**: 保持原有的复古报纸风格

## [2024-12-19] - 期刊详情页 Supabase 集成

### 🎉 重大更新
- **详情页数据源**: 期刊详情页完全使用 Supabase 数据
- **HTML 内容格式化**: 自动解析和格式化 content 字段的 HTML 内容
- **服务端渲染**: 详情页在服务端获取数据，提升 SEO 和性能

### ✨ 新功能
- **内容解析**: 智能解析 content 字段，支持 HTML 和纯文本格式
- **自动标签生成**: 从摘要内容自动提取相关标签
- **动态介绍**: 根据日期自动生成期刊介绍文本
- **占位符保留**: 保留现有字段结构作为占位符

### 🔧 技术改进
- **服务端数据获取**: 详情页在服务端直接获取 Supabase 数据
- **HTML 安全渲染**: 使用 dangerouslySetInnerHTML 安全渲染 HTML 内容
- **错误处理**: 完善的错误处理和降级机制
- **类型安全**: 完整的 TypeScript 类型定义

### 📊 数据流程
- **详情页**: Supabase → 服务端 → 页面渲染
- **首页**: Supabase → 客户端 → 动态加载
- **内容格式**: 自动检测 HTML/文本格式并相应处理

### 🎨 用户体验
- **快速加载**: 服务端渲染确保内容立即可见
- **SEO 友好**: 完整的元数据和结构化内容
- **响应式设计**: 保持原有的复古报纸风格

## [2024-12-19] - Supabase 数据集成

### 🎉 重大更新
- **数据库集成**: 集成 Supabase 作为数据源
- **实时数据**: 首页期刊数据从 Supabase 实时获取
- **错误处理**: 优雅的降级机制和错误提示

### ✨ 新功能
- **Supabase 客户端**: 配置 Supabase 客户端和类型定义
- **API 服务层**: 创建统一的数据获取接口
- **数据映射**: 将 Supabase 数据映射为前端显示格式
- **加载状态**: 添加加载动画和错误状态处理
- **备用数据**: 连接失败时自动使用备用数据

### 🔧 技术改进
- **类型安全**: 完整的 TypeScript 类型定义
- **错误边界**: 完善的错误处理和用户提示
- **性能优化**: 客户端数据缓存和状态管理
- **国际化**: 新增加载和错误状态的翻译

### 📊 数据管理
- **表结构**: 支持 `n8n-ai-contents` 表 (id/title/content/summary/created_at)
- **数据获取**: `getIssueSummaries()` 和 `getAiContentById()` API
- **标签提取**: 自动从内容中提取相关标签
- **日期格式化**: 统一的日期显示格式

### 📝 文档更新
- **配置说明**: 添加 `SUPABASE_SETUP.md` 配置指南
- **环境变量**: 详细的 Supabase 环境变量配置
- **故障排除**: 常见问题和解决方案

## [2024-12-19] - 项目重构完成

### 🎉 重大更新
- **项目重构**: 从Vite + React迁移到Next.js 16 SSR架构
- **SEO优化**: 实现完整的服务端渲染，搜索引擎友好
- **性能提升**: 采用Next.js 16 + React 19最新技术栈

### ✨ 新功能
- **服务端渲染(SSR)**: 所有页面支持服务端预渲染
- **动态路由**: 期刊详情页支持动态slug参数
- **SEO元数据**: 自动生成title、description、Open Graph等
- **多语言支持**: 中英文界面无缝切换
- **响应式设计**: 完美适配移动端和桌面端

### 🔧 技术改进
- **框架升级**: Vite → Next.js 16 (App Router)
- **React版本**: React 18 → React 19
- **路由系统**: React Router → Next.js App Router
- **样式系统**: 优化Tailwind CSS配置
- **国际化**: 适配Next.js的i18n配置

### 🐛 问题修复
- **期刊详情页**: 修复动态路由参数处理问题
- **SSR渲染**: 解决HTML源代码为空的问题
- **组件兼容**: 修复客户端/服务端组件混用问题
- **样式问题**: 解决Tailwind CSS @apply指令问题

### 📁 项目结构
- **清理项目**: 删除原始Vite项目文件
- **统一结构**: 将SSR项目提升为正式项目
- **文档更新**: 完善README和项目文档

### 🚀 部署优化
- **构建优化**: 配置Next.js生产构建
- **性能优化**: 启用压缩和静态优化
- **SEO配置**: 完整的搜索引擎优化设置

---

## [2024-12-19] - 初始版本

### 🎯 项目启动
- **项目创建**: 基于Vite + React + TypeScript创建
- **UI框架**: 集成shadcn/ui组件库
- **样式系统**: 配置Tailwind CSS
- **国际化**: 实现中英文切换功能

### 📋 核心功能
- **首页**: 英雄区域和最近期刊展示
- **期刊列表**: 可筛选的期刊列表页面
- **期刊详情**: 详细的期刊内容展示
- **响应式**: 移动端和桌面端适配

### 🎨 设计特色
- **复古风格**: 报纸风格的视觉设计
- **现代交互**: 流畅的用户体验
- **多语言**: 中英文界面支持