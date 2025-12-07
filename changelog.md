## 2025-01-XX - 添加符合项目规范的 404 页面

### ✨ 新功能
- **404 页面**: 创建了符合项目规范的 404 页面 (`src/app/[lang]/not-found.tsx`)
- **多语言支持**: 404 页面支持中英文切换，符合项目的国际化规范
- **SEO 优化**: 包含完整的 SEO 元数据，包括 Open Graph 和 Twitter Card
- **设计一致性**: 页面设计符合项目的复古报纸风格，与其他页面保持一致

### 🔧 技术实现
- **服务端组件**: 使用 Next.js 16 App Router 的服务端组件实现
- **语言检测**: 自动检测 URL 中的语言参数，无效时回退到默认语言（中文）
- **翻译资源**: 从语言文件 (`src/lib/locales/`) 直接导入翻译，符合项目规范
- **元数据生成**: 实现 `generateMetadata` 函数，生成符合 SEO 要求的元数据
- **导航链接**: 提供返回首页和查看所有期刊的导航链接

### 📝 修改文件
- `src/app/[lang]/not-found.tsx` - 新建 404 页面组件
- `src/lib/locales/en.ts` - 添加英文翻译文本
- `src/lib/locales/zh_CN.ts` - 添加中文翻译文本

### 🎯 功能特性
- **响应式设计**: 完美适配移动端和桌面端
- **用户友好**: 清晰的错误提示和导航选项
- **SEO 友好**: 设置 `robots` 元数据为 `noindex, nofollow`，避免搜索引擎索引 404 页面
- **语言一致性**: 使用与项目其他页面相同的语言检测和切换机制

### ⚠️ 注意事项
- 404 页面会自动检测 URL 中的语言参数
- 如果语言参数无效，会自动回退到默认语言（中文）
- 页面使用服务端渲染，确保 SEO 友好

---

## 2025-01-XX - 修复订阅成功页面语言路由重定向

### 🐛 问题修复
- **问题描述**: 首页订阅成功后跳转的 `/subscribe/success` 没有到对应的语言路由
- **根本原因**: Brevo 表单提交后重定向到非语言路由 `/subscribe/success`，而不是 `[lang]/subscribe/success`
- **影响范围**: 用户从首页订阅后，成功页面没有使用正确的语言路由

### ✨ 解决方案
- **自动重定向**: 在非语言路由的 `/subscribe/success` 页面添加自动重定向逻辑
- **语言检测**: 使用 `useCurrentLanguage` hook 检测当前语言（从 cookie、localStorage 或浏览器语言）
- **路径检查**: 检查当前路径是否已包含语言前缀，避免不必要的重定向
- **参数保留**: 重定向时保留所有 URL 查询参数（email、status、activated）

### 🔧 技术实现
- **客户端重定向**: 使用 `useEffect` 和 `router.replace` 实现客户端重定向
- **路径检测**: 使用 `getLanguageFromPath` 检查路径是否已包含语言前缀
- **加载状态**: 添加加载状态，避免重定向期间的闪烁
- **参数传递**: 使用 `URLSearchParams` 构建查询字符串，确保所有参数正确传递

### 📝 修改文件
- `src/app/subscribe/success/page.tsx` - 添加自动重定向逻辑和语言检测

### 🎯 工作流程
1. 用户从首页提交 Brevo 表单
2. Brevo 重定向到 `/subscribe/success?email=xxx&status=xxx`
3. 页面检测当前语言（从 cookie/localStorage/浏览器语言）
4. 自动重定向到 `[lang]/subscribe/success?email=xxx&status=xxx`
5. 显示对应语言的订阅成功页面

### ⚠️ 注意事项
- 重定向是客户端进行的，可能会有短暂的加载状态
- 如果路径已经包含语言前缀，不会进行重定向
- 所有 URL 查询参数都会在重定向时保留

---

## 2025-01-XX - 修复语言切换时的 DOM 操作错误

### 🐛 问题修复
- **主要错误**: 修复了语言切换时出现的 `Uncaught TypeError: Cannot read properties of null (reading 'removeChild')` 错误
- **错误位置**: `src/components/IssueDetailContent.tsx` 中的 hreflang 标签管理逻辑
- **根本原因**: 
  1. 清理函数尝试移除可能已经不存在于 DOM 中的节点
  2. `useEffect` 依赖项包含了 `i18n` 对象，可能导致无限循环
  3. hreflang 标签管理缺少唯一标识符和错误处理

### ✨ 解决方案
- **DOM 操作安全化**: 在移除节点前检查节点是否存在（`if (node.parentNode)`）
- **唯一标识符**: 使用 `data-issue-id` 属性和唯一 ID 来精确识别和移除标签
- **错误处理**: 添加 try-catch 块来捕获和处理 DOM 操作错误
- **依赖项优化**: 移除 `useEffect` 中对 `i18n` 对象的依赖，避免无限循环
- **语言切换优化**: 优化 `LanguageSwitcher` 中的语言切换顺序，使用 `router.replace` 而不是 `router.push`

### 🔧 技术改进
- **hreflang 标签管理**: 
  - 使用 `data-issue-id` 属性标识标签
  - 使用唯一 ID (`hreflang-issue-${issueId}-en/zh`) 来精确查找
  - 添加浏览器环境检查 (`typeof window !== 'undefined'`)
- **错误处理**: 所有 DOM 操作都包装在 try-catch 中
- **清理函数**: 使用 `getElementById` 而不是直接引用，避免引用失效

### 📝 修改文件
- `src/components/IssueDetailContent.tsx` - 修复 hreflang 标签管理和 useEffect 依赖项
- `src/components/LanguageSwitcher.tsx` - 优化语言切换逻辑

### 🎯 影响范围
- 语言切换功能现在更加稳定，不会出现 DOM 操作错误
- 页面切换语言时不会在浏览器历史记录中留下过多条目
- 更好的错误处理和调试信息

### ⚠️ 注意事项
- Hydration mismatch 警告主要是由于浏览器自动化工具添加的属性导致的，不影响功能
- `Element not found` 错误可能与浏览器自动化工具相关，不影响应用功能

---

## 2025-01-XX - getAllTags 方法添加语言过滤支持

### ✨ 功能增强
- **语言过滤**: `getAllTags` 方法现在支持根据语言参数过滤标签
- **数据源变更**: 从 `n8n-ai-tags` 表改为从 `n8n-ai-contents` 表统计标签，确保标签统计与内容语言一致
- **统计逻辑**: 根据语言过滤内容后，提取并统计所有标签及其数量

### 🔧 技术改进
- **新增参数**: `getAllTags(i18nLang?: string)` 添加可选的语言参数
- **语言映射**: 使用 `mapI18nLangToDbLang` 将 i18n 语言映射为数据库语言格式
- **标签统计**: 从过滤后的内容中提取标签，使用 Map 统计每个标签的出现次数
- **排序**: 标签按数量降序排列

### 📝 修改文件
- `src/lib/api.ts` - 重构 `getAllTags` 方法，添加语言过滤逻辑
- `src/components/TagsList.tsx` - 传递 `i18n.language` 参数给 `getAllTags`
- `src/app/sitemap.ts` - 为每种语言分别获取对应的标签
- `src/app/[lang]/tags/[tag]/page.tsx` - `generateStaticParams` 中为每种语言分别获取标签

### 🎯 影响范围
- 标签列表页面现在只显示当前语言版本内容对应的标签
- Sitemap 中为每种语言生成对应的标签页面
- 静态生成时，为每种语言分别生成标签页面

### ⚠️ 注意事项
- `i18nLang` 参数是可选的，如果不传递，将返回所有语言的标签（向后兼容）
- 标签名称统一转换为小写进行统计，避免大小写不一致导致的重复统计
- 标签统计基于 `n8n-ai-contents` 表中的 `tags` 字段，使用 `extractTagsFromContent` 函数解析

---

## 2025-01-XX - 修复 Hydration 错误：IssueDetailContent 组件

### 🐛 问题修复
- **问题描述**: `IssueDetailContent` 组件出现 hydration 错误，服务器端和客户端渲染的翻译文本不匹配
- **错误位置**: `src/components/IssueDetailContent.tsx` 第 137 行的 intro 文本
- **根本原因**: 
  1. 服务器端渲染时，i18n 使用默认语言（中文）
  2. 客户端 hydration 时，i18n 检测到 URL 路径中的语言（可能是英文）
  3. 导致服务器端和客户端渲染的翻译文本不一致

### ✨ 解决方案
- **语言同步**: 从服务器端传递 `initialLang` prop 到客户端组件，确保首次渲染时使用正确的语言
- **Hydration 保护**: 在 intro 文本的 `<p>` 标签上添加 `suppressHydrationWarning` 属性
- **翻译文本包装**: 使用 `TranslatedText` 组件包装 intro 文本，确保 hydration 安全

### 🔧 技术改进
- **新增 prop**: `IssueDetailContent` 组件新增 `initialLang?: string` prop
- **语言同步**: 使用 `useEffect` 在组件挂载后同步服务器端语言到客户端 i18n
- **Hydration 保护**: 在 intro 文本上添加双重保护（`suppressHydrationWarning` + `TranslatedText`）

### 📝 修改文件
- `src/components/IssueDetailContent.tsx` - 添加 `initialLang` prop 和语言同步逻辑
- `src/app/[lang]/issues/[slug]/page.tsx` - 传递 `initialLang` prop 到 `IssueDetailContent`

### ⚠️ 注意事项
- `TranslatedText` 组件已经在内部使用了 `suppressHydrationWarning`，不需要重复传递
- 语言同步在 `useEffect` 中执行，确保不会阻塞首次渲染
- 如果 hydration 错误仍然存在，可能需要检查其他翻译文本是否都被正确包装

---

## 2025-01-XX - 函数重构：getAiContentById 重命名为 getAiContentByJournalId

### 🔄 重构内容
- **函数重命名**: 将 `getAiContentById` 函数重命名为 `getAiContentByJournalId`，以更准确地反映其功能
- **参数重命名**: 函数参数从 `id` 重命名为 `journalId`，语义更清晰
- **影响范围**: 
  - API 函数定义
  - 所有调用该函数的地方
  - 相关文档和注释

### ✨ 修改详情
- **函数定义更新** (`src/lib/api.ts`):
  - 函数名：`getAiContentById` → `getAiContentByJournalId`
  - 参数名：`id: string` → `journalId: string`
  - 注释更新：从"根据 ID 获取"改为"根据 journal_id 获取"
  - 错误日志更新：使用新的函数名和参数名
- **调用更新**:
  - `src/app/[lang]/issues/[slug]/page.tsx`: 2 处调用已更新
  - `src/app/issues/[slug]/page.tsx`: 1 处调用已更新
- **文档更新**:
  - `changelog.md`: 更新函数引用
  - `ai-docs/supabase-lang-filter-2025-10-29.md`: 更新函数名和参数说明
  - `ai-docs/supabase-integration-summary.md`: 更新函数说明

### 📝 修改文件
- `src/lib/api.ts` - 函数定义和实现
- `src/app/[lang]/issues/[slug]/page.tsx` - 函数调用
- `src/app/issues/[slug]/page.tsx` - 函数调用
- `changelog.md` - 更新日志
- `ai-docs/supabase-lang-filter-2025-10-29.md` - 技术文档
- `ai-docs/supabase-integration-summary.md` - 集成总结文档

### ⚠️ 注意事项
- 函数功能保持不变，只是名称和参数名更清晰
- 所有调用处已同步更新，无需额外迁移
- 建议在代码审查时确认所有引用都已更新

---

## 2025-01-XX - 字段重构：issue_id 重命名为 journal_id

### 🔄 重构内容
- **字段重命名**: 将数据库和代码中的 `issue_id` 字段统一重构为 `journal_id`
- **影响范围**: 
  - 数据库查询字段
  - TypeScript 接口定义
  - 所有组件中的字段引用
  - URL 路由参数

### ✨ 修改详情
- **接口更新**:
  - `IssueSummary` 接口：`issue_id` → `journal_id`
  - `N8nAiContent` 接口：新增 `journal_id` 字段（可选）
- **数据库查询更新**:
  - `getAllAiContentsPaginated`: 查询字段从 `issue_id` 改为 `journal_id`
  - `getAiContentByJournalId` (原 `getAiContentById`): 查询条件从 `.eq('issue_id', id)` 改为 `.eq('journal_id', journalId)`，函数名和参数名已更新
  - `getIssueSummaries`: 查询字段从 `issue_id` 改为 `journal_id`
- **组件更新**:
  - `TagIssuesList.tsx`: 所有 `issue.issue_id` 引用改为 `issue.journal_id`
  - `RecentIssues.tsx`: 所有 `issue.issue_id` 引用改为 `issue.journal_id`
  - `IssuesList.tsx`: 所有 `issue.issue_id` 引用改为 `issue.journal_id`
- **其他更新**:
  - `sitemap.ts`: URL 生成使用 `journal_id`，带回退到 `id`
  - `test-supabase/page.tsx`: 测试页面更新为使用 `journal_id`

### 📝 修改文件
- `src/lib/api.ts` - 接口定义和查询逻辑
- `src/lib/supabase.ts` - 数据库类型定义
- `src/components/TagIssuesList.tsx` - 标签问题列表组件
- `src/components/RecentIssues.tsx` - 最近问题组件
- `src/components/IssuesList.tsx` - 问题列表组件
- `src/app/sitemap.ts` - 网站地图生成
- `src/app/test-supabase/page.tsx` - Supabase 测试页面

### ⚠️ 注意事项
- 数据库表 `n8n-ai-contents` 中的字段名需要同步更新（如果尚未更新）
- 旧数据可能需要迁移脚本将 `issue_id` 值复制到 `journal_id`
- 代码中添加了回退逻辑：`item.journal_id || item.id` 以兼容过渡期

---

## 2025-12-04 - 浏览器自动化文件上传改进

### 🐛 问题修复
- **问题描述**: 在使用 Chrome DevTools MCP 进行浏览器自动化时，点击文件上传按钮会弹出系统文件选择对话框，导致自动化流程卡住
- **根本原因**: 
  1. 点击文件上传按钮会触发 `input[type="file"]` 的 click 事件
  2. 浏览器安全机制会弹出系统级别的文件选择对话框
  3. 自动化工具无法直接控制系统对话框，导致流程阻塞

### ✨ 解决方案
- **直接上传**: 不点击触发文件选择的按钮，而是直接找到文件输入元素并使用 `upload_file` 工具
- **避免对话框**: 使用 `upload_file` 工具直接操作文件输入元素，不触发系统文件选择对话框
- **改进流程**: 通过 JavaScript 查找隐藏的文件输入元素，然后直接上传文件

### 🔧 技术改进
- **新增文档**: 
  - `ai-docs/browser-automation-file-upload-fix.md` - 详细的改进方案和最佳实践
  - `scripts/browser-automation-upload-example.md` - 实际应用示例和代码对比
- **关键改进点**:
  1. 使用 `upload_file` 工具替代点击按钮
  2. 通过 JavaScript 查找隐藏的文件输入元素
  3. 添加上传完成等待机制
  4. 提供错误处理和重试机制

### 📝 修改文件
- **新增文档**:
  - `ai-docs/browser-automation-file-upload-fix.md` - 浏览器自动化文件上传改进方案
  - `scripts/browser-automation-upload-example.md` - 实际应用示例

### 🎯 使用方法
1. **查找文件输入元素**: 使用 `evaluate_script` 查找 `input[type="file"]` 元素
2. **直接上传文件**: 使用 `upload_file` 工具，传入文件输入元素的 uid 和文件路径
3. **等待上传完成**: 使用 `wait_for` 等待上传完成标识（如 "100%" 或 "上传完成"）

### ⚠️ 注意事项
- 文件输入元素通常是隐藏的（`display: none`），需要通过 JavaScript 查找
- 使用绝对路径或正确的相对路径（如 `~/Downloads/podcast/file.mp3`）
- 上传是异步的，需要添加适当的等待机制
- 建议添加错误处理和重试机制

---

## 2025-01-XX - 修复 Open Graph (OG) Meta 标签图片显示问题

### 🐛 问题修复
- **问题描述**: 在 x.com (Twitter) 上分享链接时，没有显示预览图片
- **根本原因**: 
  1. 图片 URL 使用相对路径（`/x_welcome.jpg`），但 Twitter/X 需要绝对 URL（包含完整域名）
  2. 部分页面缺少 Open Graph images 或 Twitter Card 配置

### ✨ 解决方案
- **工具函数**: 创建 `getAbsoluteUrl()` 函数，自动生成完整的图片 URL（使用 `NEXT_PUBLIC_SITE_URL` 环境变量）
- **绝对 URL**: 所有 meta 标签中的图片 URL 现在使用绝对路径（例如：`https://www.snapallx.com/x_welcome.jpg`）
- **完整配置**: 确保所有页面都有完整的 Open Graph 和 Twitter Card 配置，包括图片信息

### 🔧 技术改进
- **新增工具函数**: `src/lib/utils.ts` 中添加 `getAbsoluteUrl()` 函数
- **统一配置**: 所有页面的 meta 标签统一使用绝对 URL
- **环境变量**: 使用 `NEXT_PUBLIC_SITE_URL` 环境变量（默认值：`https://www.snapallx.com`）

### 📝 修改文件
- **新增功能**:
  - `src/lib/utils.ts` - 添加 `getAbsoluteUrl()` 工具函数
- **更新的文件**:
  - `src/app/layout.tsx` - 添加 Twitter Card 配置，使用绝对 URL
  - `src/app/page.tsx` - 添加 Open Graph images 配置，使用绝对 URL
  - `src/app/issues/[slug]/page.tsx` - 添加 Open Graph images 配置，使用绝对 URL
  - `src/app/issues/page.tsx` - 添加 Open Graph images 和 Twitter Card 配置，使用绝对 URL
  - `src/app/tags/page.tsx` - 添加 Open Graph images 和 Twitter Card 配置，使用绝对 URL
  - `src/app/tags/[tag]/page.tsx` - 添加 Open Graph images 和 Twitter Card 配置，使用绝对 URL
  - `src/app/subscribe/snow/layout.tsx` - 添加 Open Graph images 和 Twitter Card 配置，使用绝对 URL
  - `src/app/test/page.tsx` - 添加 Open Graph images 和 Twitter Card 配置，使用绝对 URL

### 🎯 验证步骤
1. **检查 meta 标签**: 在浏览器中查看页面源代码，确认所有 `og:image` 和 `twitter:image` 标签使用绝对 URL
2. **Twitter Card 验证**: 使用 [Twitter Card Validator](https://cards-dev.twitter.com/validator) 验证卡片显示
3. **Open Graph 验证**: 使用 [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) 验证 Open Graph 标签
4. **环境变量**: 确保生产环境设置了正确的 `NEXT_PUBLIC_SITE_URL` 环境变量

### 📋 图片要求
- **图片尺寸**: 1200x630 像素（推荐）
- **图片格式**: JPG、PNG 或 WebP
- **文件位置**: `public/x_welcome.jpg`
- **URL 格式**: 必须是绝对 URL（例如：`https://www.snapallx.com/x_welcome.jpg`）

### ⚠️ 注意事项
- 确保 `NEXT_PUBLIC_SITE_URL` 环境变量在生产环境中正确设置
- 图片文件必须可以通过绝对 URL 公开访问
- Twitter/X 可能需要一些时间才能更新缓存的预览图片

---

## 2025-01-XX - 修复 Vercel 上中文标签页面无法访问的问题

### 🐛 问题修复
- **问题描述**: 本地访问 `/tags/AI基础设施` 显示正常，但发布到 Vercel 后访问 `https://www.snapallx.com/tags/AI%E5%9F%BA%E7%A1%80%E8%AE%BE%E6%96%BD` 显示不正常（标签参数未正确解码）
- **根本原因**: `generateStaticParams` 返回了编码后的标签名称，但 Next.js 的路由匹配器会自动解码 URL 参数，导致路径不匹配

### ✨ 解决方案
- **正确的 URL 编码处理**: `generateStaticParams` 现在返回未编码的标签名称，Next.js 会自动处理 URL 编码
- **动态参数支持**: 添加 `export const dynamicParams = true`，确保即使静态生成失败，也能动态生成页面
- **参数解码处理**: 在页面组件中添加了完善的参数解码逻辑，使用 try-catch 确保即使解码失败也能正常工作

### 🔧 技术改进
- **静态生成优化**: `generateStaticParams` 现在返回未编码的标签名称（`t.name`），Next.js 会自动处理 URL 编码
- **错误处理**: 添加了完善的错误处理机制，确保解码失败时也能正常显示页面
- **兼容性**: 同时支持编码和未编码的 URL 参数，提高兼容性

### 📝 修改文件
- **更新的文件**:
  - `src/app/tags/[tag]/page.tsx` - 修复 URL 编码处理逻辑，添加动态参数支持

### 🎯 验证步骤
1. 本地测试：访问 `/tags/AI基础设施` 应该正常显示
2. Vercel 部署：访问 `https://www.snapallx.com/tags/%E5%A4%A7%E6%A8%A1%E5%9E%8B` 应该正常显示
3. 检查静态生成：确保构建时所有标签页面都能正确生成

---

## 2025-01-XX - 统一邮件发送 API 和脚本逻辑

### 🎯 代码统一
- **逻辑统一**: 将 API 路由 (`/api/send-latest-ai-news/route.ts`) 的逻辑与脚本文件 (`scripts/send-latest-ai-news.js`) 保持一致
- **消除重复**: 统一两个实现的逻辑，避免代码重复和维护困难

### ✨ 功能增强
- **多模式支持**: API 路由现在支持 `ai` 和 `snow` 两种模式
- **模式配置**: 添加统一的模式配置（MODES），包含 campaignId、表名、显示名称、发件人名称和时间限制
- **时间限制检查**: 添加时间限制检查功能，snow 模式只能在周三和周五的 8:00-9:00 之间执行
- **is_published 支持**: 
  - 查询时只获取 `is_published=false` 的记录
  - 发送成功后自动更新 `is_published=true`
- **批量执行**: 支持不传 `type` 参数时遍历所有模式执行

### 🔧 技术改进
- **参数变更**: API 路由从 `campaignId` 参数改为 `type` 参数（`ai` 或 `snow`）
- **响应格式**: 更新响应格式，支持多模式执行结果汇总
- **错误处理**: 改进错误处理，支持部分模式失败的情况（返回 207 Multi-Status）
- **类型安全**: 添加完整的 TypeScript 类型定义

### 📝 修改文件
- **更新的文件**:
  - `src/app/api/send-latest-ai-news/route.ts` - 完全重写，与脚本文件逻辑保持一致
  - `changelog.md` - 记录此次变更

### 🔄 API 使用方式变更
**旧方式**:
```
GET /api/send-latest-ai-news?campaignId=6
POST /api/send-latest-ai-news
{
  "campaignId": 6
}
```

**新方式**:
```
# 执行 ai 模式
GET /api/send-latest-ai-news?type=ai
POST /api/send-latest-ai-news
{
  "type": "ai"
}

# 执行 snow 模式
GET /api/send-latest-ai-news?type=snow
POST /api/send-latest-ai-news
{
  "type": "snow"
}

# 执行所有模式（不传 type 参数）
GET /api/send-latest-ai-news
POST /api/send-latest-ai-news
```

### 📋 模式配置
- **ai 模式**:
  - Campaign ID: 6
  - 表名: `n8n-ai-contents`
  - 发件人名称: `[AI]News`
  - 时间限制: 无限制

- **snow 模式**:
  - Campaign ID: 10
  - 表名: `n8n-good-contents`
  - 发件人名称: `[Snow]News`
  - 时间限制: 只能在周三和周五的 8:00-9:00 之间执行

### ⚠️ 注意事项
- API 路由的参数从 `campaignId` 改为 `type`，需要更新调用代码
- Vercel Cron Jobs 配置需要更新，使用 `type` 参数而不是 `campaignId`
- 时间限制检查会在 API 路由中自动执行，不符合时间要求的模式会被跳过

---

## 2025-01-XX - 邮件发送脚本：添加 is_published 字段支持

### 🎯 新功能
- **is_published 字段支持**: 添加对 `is_published` 布尔字段的支持
- **自动状态更新**: 邮件发送成功后，自动将记录的 `is_published` 字段更新为 `true`
- **防重复发送**: 查询时只获取 `is_published=false` 的记录，避免重复发送

### ✨ 功能特性
- **状态管理**: 通过 `is_published` 字段标记内容是否已发送
- **自动更新**: 邮件发送成功后自动更新数据库状态
- **错误处理**: 更新失败不会影响邮件发送流程，仅记录警告
- **类型安全**: 更新了 TypeScript 类型定义，添加 `is_published?: boolean` 字段

### 📝 修改文件
- **更新的文件**:
  - `scripts/send-latest-ai-news.js` - 添加 `updateIsPublished` 函数和更新逻辑
  - `src/lib/supabase.ts` - 更新 `N8nAiContent` 接口，添加 `is_published` 字段
  - `ai-docs/send-latest-ai-news-script.md` - 更新文档，记录新功能
  - `changelog.md` - 记录此次变更

### 🔧 技术实现
- **新增函数**: `updateIsPublished(table, recordId)` - 更新指定记录的 `is_published` 字段
- **更新时机**: 在邮件发送成功后（`sendResults.success > 0`）执行更新
- **错误处理**: 使用 try-catch 包裹更新逻辑，失败时记录警告但不中断流程
- **查询优化**: 查询时添加 `.eq('is_published', false)` 条件，只获取未发布的内容

### 📋 工作流程
1. 查询 `lang=zh_CN` 且 `is_published=false` 的最新记录
2. 获取订阅者邮件列表
3. 批量发送邮件给所有订阅者
4. 如果发送成功（至少成功发送一封），更新记录的 `is_published` 为 `true`
5. 下次执行时，已发布的内容不会被重复查询和发送

### ⚠️ 注意事项
- 确保 Supabase 表中有 `is_published` 布尔字段
- 确保 Supabase RLS 策略允许更新操作
- 更新失败不会影响邮件发送，但需要手动检查数据库状态

---

## 2025-01-XX - 添加 SNOW 订阅页面

### 🎯 新功能
- **SNOW 订阅页面**: 创建 `/subscribe/snow` 页面，提供简洁的邮件订阅界面
- **设计风格**: 采用居中白色卡片布局，浅灰色背景，参考图片设计
- **国际化支持**: 完整的中英文翻译支持

### ✨ 功能特性
- **简洁设计**: 居中白色卡片，浅灰色背景，符合现代简约风格
- **响应式布局**: 完美适配移动端和桌面端
- **表单验证**: 邮箱格式验证和错误提示
- **订阅集成**: 集成现有的 `/api/subscribe` API，支持 Brevo 订阅
- **SEO 优化**: 完整的元数据支持（title、description、Open Graph、Twitter Card）

### 📝 修改文件
- **新增文件**:
  - `src/app/subscribe/snow/page.tsx` - SNOW 订阅页面组件
  - `src/app/subscribe/snow/layout.tsx` - SNOW 订阅页面布局（元数据）
- **更新的文件**:
  - `src/lib/locales/zh_CN.ts` - 添加 SNOW 订阅页面的中文翻译
  - `src/lib/locales/en.ts` - 添加 SNOW 订阅页面的英文翻译
  - `allaboutproject.md` - 更新路由配置说明
  - `changelog.md` - 记录此次变更

### 🎨 页面设计
- **标题**: "All you care [SNOW] news"
- **提示文字**: "注意:一旦订阅成功,请尽量控制自己的钱包不要破产。"
- **图片区域**: 预留雪地照片占位符（用户可替换为实际图片）
- **表单字段**:
  - 邮箱输入框（必填）
  - 提示文字："Provide your email address to subscribe. For e.g abc@xyz.com"
- **提交按钮**: "Drop it!"

### 🔧 技术实现
- **客户端组件**: 使用 React Hooks 管理表单状态
- **表单提交**: 集成 `/api/subscribe` API
- **错误处理**: 使用 sonner 显示错误提示
- **成功跳转**: 订阅成功后跳转到 `/subscribe/success` 页面
- **图片支持**: 预留图片占位符，支持 Next.js Image 组件

### 📋 国际化键值
- `snowSubscribe.title` - 页面标题
- `snowSubscribe.note` - 提示文字
- `snowSubscribe.emailLabel` - 邮箱标签
- `snowSubscribe.emailPlaceholder` - 邮箱占位符
- `snowSubscribe.emailHint` - 邮箱提示
- `snowSubscribe.submitButton` - 提交按钮文字
- `snowSubscribe.submitting` - 提交中状态
- `snowSubscribe.errorTitle` - 错误标题
- `snowSubscribe.subscribeError` - 错误消息

### 🌐 访问方式
- **访问路径**: `/subscribe/snow`
- **SEO 友好**: 完整的元数据支持，搜索引擎可正确索引

### 📝 注意事项
- **图片替换**: 页面中包含图片占位符，需要用户替换为实际的雪地照片
- **图片路径**: 如果使用图片，请将图片放在 `public/` 目录下，并更新页面中的图片路径

## 2025-01-XX - 添加动态 sitemap.xml 生成功能

### 🎯 SEO 优化
- **动态 Sitemap**: 创建 `src/app/sitemap.ts` 文件，自动生成包含所有页面的 sitemap.xml
- **自动更新**: sitemap 从 Supabase 动态获取数据，确保包含最新的 issues 和标签
- **完整覆盖**: sitemap 包含首页、issues 列表页、tags 列表页、所有 issue 详情页和所有标签页面

### ✨ 功能特性
- **动态生成**: 使用 Next.js App Router 的 sitemap.ts 功能，自动映射到 `/sitemap.xml` 路由
- **优先级设置**: 为不同页面设置合理的优先级（首页 1.0，issues 列表 0.9，tags 列表 0.8，issue 详情 0.7，标签页面 0.6）
- **更新频率**: 设置合适的 changeFrequency（首页和 issues 列表 daily，其他页面 weekly）
- **最后修改时间**: 根据 issue 的创建时间设置 lastModified

### 📝 修改文件
- **新增文件**:
  - `src/app/sitemap.ts` - 动态 sitemap 生成文件
- **更新的文件**:
  - `public/robots.txt` - 更新 sitemap 路径为实际 URL
  - `changelog.md` - 记录此次变更

### 🔧 技术实现
- **Next.js Sitemap**: 使用 `MetadataRoute.Sitemap` 类型定义
- **数据获取**: 从 Supabase 获取所有 issues 和标签数据
- **URL 编码**: 标签页面 URL 使用 `encodeURIComponent` 确保特殊字符正确处理
- **错误处理**: 完善的错误处理，确保部分数据获取失败时不影响其他页面

### 📋 Sitemap 包含的页面
- **静态页面**:
  - `/` - 首页（优先级 1.0）
  - `/issues` - Issues 列表页（优先级 0.9）
  - `/tags` - Tags 列表页（优先级 0.8）
- **动态页面**:
  - `/issues/[id]` - 所有 issue 详情页（优先级 0.7）
  - `/tags/[tag]` - 所有标签页面（优先级 0.6）

### 🌐 访问方式
- **访问路径**: `https://www.snapallx.com/sitemap.xml`
- **自动生成**: Next.js 会自动处理 `/sitemap.xml` 路由
- **搜索引擎**: 搜索引擎可以通过 robots.txt 中的 sitemap 声明找到 sitemap

### ⚙️ 环境变量
- `NEXT_PUBLIC_SITE_URL` - 网站基础 URL（可选，默认值为 `https://www.snapallx.com`）

### 📚 相关文档
- Next.js Sitemap 文档: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap

## 2025-01-XX - 添加 robots.txt 文件

### 🎯 SEO 优化
- **搜索引擎控制**: 添加 robots.txt 文件，控制搜索引擎爬虫的访问行为
- **恶意爬虫屏蔽**: 屏蔽 ThinkChaos、SemrushBot、AhrefsBot、MJ12bot、DotBot、Rogerbot 等恶意爬虫
- **主流搜索引擎允许**: 允许 Googlebot、Bingbot、Baiduspider、YandexBot、Twitterbot、facebookexternalhit 等主流搜索引擎爬虫
- **AI 爬虫支持**: 允许 GPTBot、OAI-SearchBot、ChatGPT-User、ClaudeBot、Claude-Web、Google-Extended 等 AI 爬虫

### ✨ 功能特性
- **路径限制**: 限制爬虫访问 WordPress 相关路径（/wp-admin/、/wp-includes/、/wp-content/plugins/、/wp-json/）
- **搜索路径限制**: 限制访问 /search/ 路径和带查询参数的 URL（/*?*）
- **爬取延迟**: 为其他未明确允许的爬虫设置 10 秒的爬取延迟
- **Sitemap 配置**: 预留 Sitemap 配置位置（当前为占位符 xxxx.xml）

### 📝 修改文件
- **新增文件**:
  - `public/robots.txt` - 搜索引擎爬虫控制文件
- **更新的文件**:
  - `changelog.md` - 记录此次变更

### 🔧 配置说明
- **文件位置**: `public/robots.txt` - Next.js 会自动将其作为静态文件提供
- **访问路径**: 网站根目录下的 `/robots.txt`
- **更新方式**: 直接编辑 `public/robots.txt` 文件即可生效
- **Sitemap**: 当前 Sitemap 配置为占位符，需要后续更新为实际的 sitemap.xml 路径

### 📋 爬虫规则
- **完全屏蔽**: ThinkChaos、SemrushBot、AhrefsBot、MJ12bot、DotBot、Rogerbot
- **完全允许**: Googlebot、Bingbot、Baiduspider、YandexBot、Twitterbot、facebookexternalhit
- **AI 爬虫允许**: GPTBot、OAI-SearchBot、ChatGPT-User、ClaudeBot、Claude-Web、Google-Extended
- **其他爬虫**: 默认允许但设置 10 秒爬取延迟

### 🚫 限制路径
- `/wp-admin/` - WordPress 管理后台
- `/wp-includes/` - WordPress 核心文件
- `/wp-content/plugins/` - WordPress 插件
- `/wp-json/` - WordPress REST API
- `/search/` - 搜索页面
- `/*?*` - 所有带查询参数的 URL

### 📚 相关文档
- robots.txt 规范: https://www.robotstxt.org/
- Google 爬虫指南: https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt

## 2025-01-XX - 添加域名重定向功能

### 🎯 功能增强
- **域名重定向**: 添加中间件，当访问 `ai.snapallx.com` 时自动重定向到首页
- **SEO友好**: 使用 Next.js 中间件实现域名重定向，确保搜索引擎正确处理

### ✨ 新功能
- **中间件配置**: 创建 `src/middleware.ts` 文件处理域名重定向
- **域名检测**: 自动检测请求的域名，匹配 `ai.snapallx.com` 时进行重定向
- **路径保留**: 重定向时保留原始请求的协议和路径信息

### 🔧 技术实现
- **中间件匹配**: 配置中间件匹配所有路径（排除 API 路由和静态资源）
- **域名检查**: 检查请求头中的 `host` 字段，匹配目标域名
- **重定向响应**: 使用 `NextResponse.redirect()` 重定向到首页

### 📝 修改文件
- **新增文件**:
  - `src/middleware.ts` - Next.js 中间件，处理域名重定向
- **更新的文件**:
  - `changelog.md` - 记录此次变更
  - `allaboutproject.md` - 添加域名重定向说明

### 🔄 使用方式
- **自动重定向**: 当用户访问 `ai.snapallx.com` 或 `ai.snapallx.com:端口` 时，自动重定向到首页
- **路径处理**: 所有路径都会被重定向到首页（`/`）
- **静态资源**: API 路由和静态资源不受影响，正常访问

### 📋 配置说明
- **匹配规则**: 中间件匹配所有路径，除了：
  - `/api/*` - API 路由
  - `/_next/static/*` - 静态文件
  - `/_next/image/*` - 图片优化文件
  - `/favicon.ico` - 网站图标

### 📚 相关文档
- Next.js Middleware 文档: https://nextjs.org/docs/app/building-your-application/routing/middleware

## 2025-01-XX - Vercel Cron Job 自动发送最新 AI 新闻

### 🎯 功能增强
- **自动化邮件发送**: 配置 Vercel Cron Jobs，自动在指定时间发送最新的 AI 新闻给邮件订阅者
- **定时任务**: 每天 8:30、13:30 和 20:30（UTC 时间）自动执行
- **API 路由**: 新增 `/api/send-latest-ai-news` API 路由，用于执行邮件发送任务

### ✨ 新功能
- **Cron 配置**: 在 `vercel.json` 中添加三个 cron job 配置
- **API 路由**: 创建 `src/app/api/send-latest-ai-news/route.ts` API 路由
- **功能复用**: API 路由复用了 `send-latest-ai-news.js` 脚本的所有功能
- **手动触发**: 支持通过 GET 或 POST 请求手动触发邮件发送

### 🔧 技术实现
- **Cron 表达式**: 
  - `30 8 * * *` - 每天 8:30 UTC
  - `30 13 * * *` - 每天 13:30 UTC
  - `30 20 * * *` - 每天 20:30 UTC
- **API 功能**:
  1. 从 Supabase 获取最新的 `lang=zh_CN` 内容
  2. 从 Brevo Campaign 获取订阅者列表
  3. 批量发送个性化邮件
  4. 返回详细的发送结果统计

### 📝 修改文件
- **新增文件**:
  - `src/app/api/send-latest-ai-news/route.ts` - Cron API 路由
- **更新的文件**:
  - `vercel.json` - 添加 cron jobs 配置
  - `allaboutproject.md` - 添加自动化邮件发送说明
  - `changelog.md` - 记录此次变更

### 🔄 使用方式
- **自动执行**: Vercel 会根据配置的时间自动执行 cron job
- **手动触发**: 可以通过访问 `/api/send-latest-ai-news?campaignId=6` 手动触发
- **参数配置**: 支持通过查询参数或请求体传递 `campaignId`（默认值为 6）

### 📋 环境变量要求
- `BREVO_API_KEY` - Brevo API 密钥（必需）
- `BREVO_SENDER_EMAIL` - 发件人邮箱（可选）
- `BREVO_SENDER_NAME` - 发件人名称（可选）
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL（必需）
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名密钥（必需）

### 📚 相关文档
- Vercel Cron Jobs 文档: https://vercel.com/docs/cron-jobs
- API 路由实现参考了 `scripts/send-latest-ai-news.js` 脚本的逻辑

## 2025-01-XX - 设置网站默认语言为中文

### 🎯 语言设置更新
- **默认语言**: 将网站默认语言从英文改为中文
- **服务端渲染**: 服务端渲染时默认使用中文
- **HTML lang 属性**: 更新 HTML lang 属性为 `zh-CN`
- **Open Graph**: 更新 Open Graph locale 为主语言中文

### ✨ 功能特性
- **默认中文**: 新用户访问网站时默认显示中文界面
- **语言检测**: 保留浏览器语言检测和 localStorage 语言偏好
- **回退语言**: 将 fallbackLng 从 'en' 改为 'zh-CN'
- **SEO优化**: HTML lang 属性设置为中文，提升中文SEO表现

### 📝 修改文件
- `src/lib/i18n.ts` - 更新默认语言检测逻辑，服务端和客户端默认返回 'zh-CN'
- `src/app/layout.tsx` - 更新 HTML lang 属性为 'zh-CN'，更新 Open Graph locale

### 🔧 技术改进
- **服务端默认**: 服务端渲染时返回 'zh-CN' 而不是 'en'
- **客户端默认**: 当没有 localStorage 和浏览器语言偏好时，默认返回 'zh-CN'
- **回退语言**: i18n fallbackLng 设置为 'zh-CN'
- **元数据**: Open Graph locale 主语言设置为 'zh_CN'，备用语言为 'en_US'

### 🌐 语言优先级
1. localStorage 中保存的语言偏好（最高优先级）
2. 浏览器语言设置
3. 默认中文（zh-CN）

## 2025-01-XX - 新增发送最新 AI 新闻脚本

### ✨ 新功能
- **发送最新 AI 新闻脚本**: 新增 `scripts/send-latest-ai-news.js` 脚本，用于自动发送最新的 AI 新闻给邮件订阅者
- **自动化邮件发送**: 脚本能够从 Brevo Campaign 获取订阅者列表，从 Supabase 获取最新中文内容，并批量发送邮件

### 📝 功能特性
- **订阅者获取**: 从指定的 Brevo Campaign 获取所有订阅者邮件列表
- **内容获取**: 从 Supabase `n8n-ai-contents` 表获取最新的 `lang=zh_CN` 记录
- **批量发送**: 使用 Brevo Transactional Email API 批量发送个性化邮件
- **错误处理**: 完整的错误处理和进度跟踪
- **个性化支持**: 支持邮件内容中的占位符替换（`{{FIRSTNAME}}`, `{{LASTNAME}}`, `{{EMAIL}}`）

### 📝 修改文件
- **新增文件**:
  - `scripts/send-latest-ai-news.js` - 主脚本文件
  - `ai-docs/send-latest-ai-news-script.md` - 脚本实现文档
- **更新的文件**:
  - `scripts/README.md` - 添加新脚本的使用说明
  - `changelog.md` - 记录此次变更

### 🔧 使用方法
```bash
# 使用默认 campaign ID (6)
node scripts/send-latest-ai-news.js

# 指定 campaign ID
node scripts/send-latest-ai-news.js 6
```

### 📋 环境变量要求
- `BREVO_API_KEY` - Brevo API 密钥（必需）
- `BREVO_SENDER_EMAIL` - 发件人邮箱（可选）
- `BREVO_SENDER_NAME` - 发件人名称（可选）
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL（必需）
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名密钥（必需）

### 📚 相关文档
- 详细实现说明请参考 `ai-docs/send-latest-ai-news-script.md`
- 脚本使用说明请参考 `scripts/README.md`

## 2025-01-XX - 移除静态页面生成机制

### 🗑️ 功能移除
- **删除静态生成脚本**: 移除了所有静态页面生成相关的脚本文件
- **移除静态导出配置**: 从 Next.js 配置中移除了静态导出相关配置
- **清理相关脚本命令**: 从 package.json 中删除了所有静态生成相关的 npm 脚本

### 📝 修改文件
- **删除的文件**:
  - `scripts/generate-static-pages.js` - 基础静态页面生成脚本
  - `scripts/generate-static-pages-advanced.js` - 高级静态页面生成脚本
  - `scripts/deploy-static.sh` - 静态站点部署脚本
  - `scripts/example-usage.js` - 静态生成使用示例脚本
- **更新的文件**:
  - `package.json` - 移除了所有静态生成相关的脚本命令
  - `next.config.ts` - 移除了 `output: 'export'` 和 `trailingSlash: true` 配置
  - `allaboutproject.md` - 删除了静态页面生成系统章节和相关描述
  - `changelog.md` - 记录此次变更

### 🔄 变更说明
项目现在完全采用服务端渲染(SSR)架构，不再支持静态页面生成和静态导出。所有页面将通过 Next.js 的服务端渲染功能提供，确保更好的动态内容支持和实时数据更新能力。

### 📋 移除的脚本命令
- `generate-static`
- `generate-static-advanced`
- `generate-static-incremental`
- `generate-static-force`
- `build-with-static`
- `build-with-static-advanced`
- `preview`
- `preview-advanced`
- `deploy`
- `deploy-vercel`
- `deploy-netlify`
- `preview-local`
- `example`
- `vercel-build`

### ⚠️ 注意事项
- 项目现在完全依赖 Next.js SSR 架构
- 部署时需要使用支持 Node.js 运行时的平台（如 Vercel）
- `out/` 目录将不再用于静态导出，如有需要可以删除

## 2025-01-XX - 订阅成功页面支持两种状态

### 🎯 功能增强
- **双状态支持**: 订阅成功页面现在支持两种不同的状态显示
- **状态识别**: 根据 URL 参数自动识别并显示对应的状态
- **激活成功状态**: 新增激活成功状态的完整UI和文案

### ✨ 新功能
- **状态 1 - 待激活**: 用户提交订阅后显示，提示去邮箱激活
- **状态 2 - 已激活**: 用户点击激活链接后显示，庆祝订阅成功
- **智能切换**: 根据 URL 参数 `status=activated` 或 `activated=true` 自动切换状态
- **视觉区分**: 两种状态使用不同的图标和颜色方案

### 🎨 UI/UX 改进
- **待激活状态**: 
  - 邮箱图标 + 蓝色提示框
  - 强调需要检查邮箱并点击激活链接
- **已激活状态**:
  - 对勾图标 + 绿色成功提示框
  - 庆祝订阅激活成功，欢迎加入社区

### 📝 修改文件
- `src/app/subscribe/success/page.tsx` - 添加状态判断逻辑和两种状态的UI
- `src/lib/locales/en.ts` - 添加激活成功状态的英文翻译
- `src/lib/locales/zh_CN.ts` - 添加激活成功状态的中文翻译

### 🌐 翻译更新
**英文版本 - 激活成功状态**:
- `activatedTitle`: "Subscription Activated!"
- `activatedSubtitle`: "Welcome to AINews"
- `activatedMessageTitle`: "You're all set!"
- `activatedMessage`: 说明订阅已激活，将开始接收邮件
- `activatedSuccessTitle`: "Subscription Confirmed"
- `activatedSuccessMessage`: 感谢确认订阅，将开始接收每日摘要

**中文版本 - 激活成功状态**:
- `activatedTitle`: "订阅已激活！"
- `activatedSubtitle`: "欢迎加入 AINews"
- `activatedMessageTitle`: "一切就绪！"
- `activatedMessage`: 说明订阅已激活，将开始接收邮件
- `activatedSuccessTitle`: "订阅确认成功"
- `activatedSuccessMessage`: 感谢确认订阅，将开始接收每日摘要

### 🔄 使用方式
- **提交后**: `/subscribe/success?email=user@example.com` (待激活状态)
- **激活后**: `/subscribe/success?email=user@example.com&status=activated` (已激活状态)
- **或**: `/subscribe/success?email=user@example.com&activated=true` (已激活状态)

## 2025-01-XX - 订阅成功页面邮箱激活提示优化

### 🎯 用户体验优化
- **激活提示**: 订阅成功页面增加明确的邮箱激活提示
- **视觉强调**: 添加邮箱图标和信息提示框，突出需要检查邮箱的重要性
- **流程说明**: 明确告知用户需要点击邮箱中的激活链接才能开始接收邮件

### ✨ 新功能
- **邮箱图标**: 在成功消息卡片顶部添加邮箱图标，视觉上提醒用户检查邮箱
- **激活提示框**: 添加醒目的信息提示框，说明激活步骤的重要性
- **多语言支持**: 激活提示文案支持中英文切换

### 🎨 UI/UX 改进
- **视觉层次**: 使用信息提示框突出显示激活步骤
- **图标提示**: 邮箱图标和信息图标增强视觉引导
- **文案优化**: 更新提示文案，明确说明不激活将无法接收邮件

### 📝 修改文件
- `src/app/subscribe/success/page.tsx` - 添加邮箱图标和激活提示框
- `src/lib/locales/en.ts` - 更新英文翻译，添加激活相关提示
- `src/lib/locales/zh_CN.ts` - 更新中文翻译，添加激活相关提示

### 🌐 翻译更新
**英文版本**:
- `messageTitle`: "Check your email!" - 提醒用户检查邮箱
- `activationTitle`: "Important: Activate Your Subscription" - 激活订阅的重要性
- `activationMessage`: 详细说明需要检查邮箱和点击激活链接
- `additionalInfo`: 提示检查垃圾邮件文件夹

**中文版本**:
- `messageTitle`: "请查收您的邮箱！" - 提醒用户检查邮箱
- `activationTitle`: "重要提示：激活您的订阅" - 激活订阅的重要性
- `activationMessage`: 详细说明需要检查邮箱和点击激活链接
- `additionalInfo`: 提示检查垃圾邮件文件夹

### 🔄 用户流程
1. 用户提交订阅表单
2. 跳转到成功页面
3. 看到邮箱图标和明确的激活提示
4. 收到确认邮件并点击激活链接
5. 开始接收订阅邮件

## 2025-01-XX - Brevo 邮件确认模板定制

### 🎨 视觉更新
- **邮件模板定制**: 创建符合网站风格的 Brevo 双重确认邮件模板
- **品牌一致性**: 邮件模板使用与网站相同的复古报纸风格和配色方案
- **双语支持**: 提供英文和中文两个版本的确认邮件模板

### ✨ 设计特性
- **品牌标识**: 邮件顶部显示 AINews logo 和 "by snapallx.com" 副标题
- **复古风格**: 使用黑色 (#171717) 作为主色调，匹配网站风格
- **字体系统**: 使用 Inter 字体作为主字体，Courier Prime 用于次要文本
- **按钮样式**: 确认按钮使用黑色背景 (#171717) 和白色文字 (#fafafa)，带有 2px 边框
- **响应式设计**: 邮件模板适配移动端和桌面端显示

### 📧 邮件内容
**英文版本** (`email-templates/double-optin-confirmation.html`):
- 标题: "Please confirm your subscription"
- 描述: "Thank you for subscribing to AINews! We're excited to help you stay ahead of the latest AI developments."
- 按钮: "Yes, subscribe me to this list"
- 隐私声明: "We respect and protect your privacy."

**中文版本** (`email-templates/double-optin-confirmation-zh.html`):
- 标题: "请确认您的订阅"
- 描述: "感谢您订阅 AINews！我们很高兴能够帮助您及时了解最新的 AI 发展动态。"
- 按钮: "是的，订阅此列表"
- 隐私声明: "我们尊重并保护您的隐私，不会将您的 email 泄露给任何第三方。"

### 🎨 样式特点
- **配色方案**: 
  - 主色: #171717 (近黑色)
  - 背景: #f5f5f5 (浅灰色)
  - 文字: #525252 (深灰色) / #737373 (中灰色)
  - 边框: #e5e5e5 (浅边框)
- **字体大小**: 
  - Logo: 32px
  - 标题: 24px
  - 正文: 14px / 13px
  - 次要文本: 12px / 11px / 10px
- **间距**: 统一使用 20px/30px/40px 的垂直间距

### 📝 文件结构
- `email-templates/double-optin-confirmation.html` - 英文版确认邮件模板
- `email-templates/double-optin-confirmation-zh.html` - 中文版确认邮件模板

### 🔧 使用说明
1. 登录 Brevo 账户
2. 导航至 "Email" → "Templates" 或 "Campaigns" → "Double opt-in"
3. 创建或编辑双重确认邮件模板
4. 将 HTML 代码复制到 Brevo 编辑器
5. 确保 `{{ doubleoptin }}` 变量正确设置（Brevo 会自动替换）
6. 根据用户语言设置自动选择对应的模板

### 📚 文档更新
- 在 `allaboutproject.md` 中添加邮件模板说明
- 更新 `changelog.md` 记录此次更新

## 2025-01-XX - 首页表单替换为 Brevo 原生表单

### 🎉 重大更新
- **表单替换**: 将首页邮件订阅表单替换为 Brevo 原生表单
- **直接提交**: 表单现在直接提交到 Brevo 服务器，无需通过后端 API
- **样式保留**: 保留网站原有的复古风格样式和 Tailwind CSS 类

### ✨ 新功能
- **Brevo 原生表单**: 使用 Brevo 提供的表单 action 直接提交
- **多语言支持**: 根据当前语言自动设置 `locale` 字段（en/zh）
- **防机器人**: 使用 Brevo 的 `email_address_check` 隐藏字段防止机器人提交

### 🔧 技术改进
- **表单结构**: 使用 Brevo 表单的字段名和结构
  - `EMAIL` - 邮箱输入字段
  - `email_address_check` - 防机器人隐藏字段
  - `locale` - 语言设置（根据 i18n 自动设置）
  - `html_type` - HTML 类型（固定为 simple）
- **提交方式**: 表单直接 POST 到 Brevo 服务器
- **样式集成**: 保留网站的 `vintage-border`、`bg-card` 等样式类
- **响应式设计**: 保持原有的响应式布局和交互效果

### 📝 修改文件
- `src/components/Hero.tsx` - 替换表单为 Brevo 原生表单，保留网站样式
- `changelog.md` - 记录此次表单替换

### 🔄 变更说明
- **移除**: 移除了 `/api/subscribe` API 调用
- **保留**: 保留了表单的加载状态和网站样式
- **兼容**: Brevo 表单会自动处理重定向和成功页面

## 2025-01-XX - 迁移邮件订阅服务从 HubSpot 到 Brevo

### 🎉 重大更新
- **服务迁移**: 将邮件订阅服务从 HubSpot 迁移到 Brevo（前称 Sendinblue）
- **API 更新**: 更新订阅 API 路由以使用 Brevo Contacts API v3
- **功能保持**: 保持所有现有功能，包括创建/更新联系人、错误处理等

### ✨ 新功能
- **Brevo 集成**: 使用 Brevo API 进行联系人管理
- **列表管理**: 支持将联系人添加到指定的 Brevo 邮件列表（可选）
- **自动更新**: 通过 `updateEnabled: true` 自动处理联系人已存在的情况

### 🔧 技术改进
- **API 端点**: 从 HubSpot API 切换到 Brevo API (`https://api.brevo.com/v3/contacts`)
- **认证方式**: 从 Bearer Token 切换到 API Key 认证
- **字段映射**: 
  - `firstName` → `FIRSTNAME` (Brevo 属性)
  - `lastName` → `LASTNAME` (Brevo 属性)
  - `SUBSCRIPTION_SOURCE` → `ainews` (标识订阅来源)
- **错误处理**: 优化错误处理逻辑，处理 Brevo API 返回的错误响应

### 📝 修改文件
- `src/app/api/subscribe/route.ts` - 完全重写订阅逻辑，从 HubSpot 切换到 Brevo
- `allaboutproject.md` - 更新文档，将 HubSpot 集成说明替换为 Brevo
- `changelog.md` - 记录此次迁移

### ⚙️ 环境配置变更
**旧配置**:
```bash
HUBSPOT_ACCESS_TOKEN=your-hubspot-access-token
```

**新配置**:
```bash
BREVO_API_KEY=your-brevo-api-key
BREVO_LIST_ID=your-list-id  # 可选
```

### 📚 文档更新
- 更新 `allaboutproject.md` 中的邮件订阅集成章节
- 添加 Brevo API 密钥获取说明
- 添加 Brevo 列表 ID 获取说明
- 更新 API 文档链接

### 🔄 迁移说明
- **向后兼容**: API 端点 `/api/subscribe` 保持不变
- **请求格式**: 请求体格式保持不变
- **响应格式**: 响应格式基本保持一致
- **环境变量**: 需要更新环境变量配置

## 2025-01-XX - 添加 subscription_type 字段到 HubSpot 订阅

### ✨ 新功能
- **用户分类标识**: 在 HubSpot 联系人中添加 `subscription_type` 字段，固定值为 `ainews`
- **便于筛选**: 可以在 HubSpot 中轻松筛选和识别从 AINews 表单提交的用户

### 🔧 技术改进
- **创建联系人**: 创建新联系人时自动设置 `subscription_type` 为 `ainews`
- **更新联系人**: 更新现有联系人时也会更新 `subscription_type` 字段
- **字段同步**: 在搜索联系人时也包含 `subscription_type` 字段

### 📝 修改文件
- `src/app/api/subscribe/route.ts` - 在创建和更新联系人时添加 `subscription_type` 字段
- `allaboutproject.md` - 更新文档说明字段映射
- `changelog.md` - 更新变更记录

## 2025-01-XX - HubSpot 邮件订阅集成

### 🎉 重大更新
- **HubSpot 集成**: 完成与 HubSpot CRM 的邮件订阅功能集成
- **自动化订阅**: 用户提交表单后自动添加到 HubSpot 联系人列表
- **联系人管理**: 支持创建新联系人和更新现有联系人信息

### ✨ 新功能
- **API 路由**: 新增 `/api/subscribe` API 端点处理订阅请求
- **表单提交**: Hero 组件表单现在会将数据提交到 HubSpot
- **加载状态**: 提交过程中显示加载状态，防止重复提交
- **错误处理**: 完善的错误处理和用户友好的错误提示
- **多语言支持**: 成功/错误消息支持中英文切换

### 🔧 技术改进
- **HubSpot Contacts API**: 使用 HubSpot CRM v3 API 进行联系人管理
- **错误处理**: 自动处理联系人已存在的情况（409错误），更新联系人信息
- **数据验证**: 服务端验证邮箱格式和必填字段
- **类型安全**: 完整的 TypeScript 类型定义

### 📧 HubSpot 功能
- **创建联系人**: 自动创建新的 HubSpot 联系人
- **更新联系人**: 如果联系人已存在，自动更新联系人信息
- **字段映射**: 
  - `email` → HubSpot `email` 字段
  - `firstName` → HubSpot `firstname` 字段
  - `lastName` → HubSpot `lastname` 字段
  - `subscription_type` → HubSpot `subscription_type` 字段（固定值：`ainews`）

### 📝 修改文件
- `src/app/api/subscribe/route.ts` - 新增 HubSpot 订阅 API 路由
- `src/components/Hero.tsx` - 更新表单提交逻辑，集成 API 调用
- `src/lib/locales/en.ts` - 添加订阅相关的英文翻译
- `src/lib/locales/zh_CN.ts` - 添加订阅相关的中文翻译
- `allaboutproject.md` - 更新项目文档，添加 HubSpot 集成说明

### ⚙️ 环境配置
需要在环境变量中配置 HubSpot Access Token:
```bash
HUBSPOT_ACCESS_TOKEN=your-hubspot-access-token
```

### 📚 文档更新
- 在 `allaboutproject.md` 中添加了完整的 HubSpot 集成文档
- 包含 API 使用说明、环境配置和获取 Access Token 的步骤

## 2025-01-XX - Issues 列表页分页功能

### 🎉 重大更新
- **分页功能**: 为 issues 列表页添加完整的分页功能，默认每页显示 10 条记录
- **SEO 友好**: 使用服务端渲染(SSR)和 URL 参数实现 SEO 友好的分页
- **URL 变化**: 翻页时 URL 会变化（例如 `/issues?page=2`），便于搜索引擎索引和用户分享

### ✨ 新功能
- **服务端分页**: 在服务端获取分页数据，提升首屏加载速度和 SEO 表现
- **分页组件**: 集成现有的 Pagination 组件，提供完整的分页导航
- **动态元数据**: 根据当前页码动态生成页面标题和元数据
- **多语言支持**: 分页相关的文本支持中英文切换

### 🔧 技术改进
- **API 层**: 新增 `getAllAiContentsPaginated()` 函数，支持分页查询
- **服务端组件**: 将 `issues/page.tsx` 改为服务端组件，接收 `searchParams` 处理分页
- **数据传递**: `IssuesList` 组件改为接收初始数据作为 props，保持客户端交互能力
- **类型安全**: 新增 `PaginatedResult<T>` 接口，提供完整的类型定义

### 📊 分页特性
- **默认显示**: 每页默认显示 10 条记录
- **URL 参数**: 使用 `?page=N` 格式的 URL 参数
- **总数统计**: 显示总记录数和当前页范围
- **页码导航**: 智能显示页码（最多显示 5 个页码，超出显示省略号）
- **上一页/下一页**: 提供便捷的导航按钮

### 🎨 用户体验
- **快速加载**: 服务端渲染确保内容立即可见
- **URL 可分享**: 每个分页都有独立的 URL，便于分享和收藏
- **SEO 优化**: 搜索引擎可以抓取所有分页内容
- **响应式设计**: 分页组件完美适配移动端和桌面端

### 📝 修改文件
- `src/lib/api.ts` - 新增分页查询函数和类型定义
- `src/app/issues/page.tsx` - 改为服务端组件，处理分页参数
- `src/components/IssuesList.tsx` - 接收分页数据作为 props，集成 Pagination 组件
- `src/lib/locales/en.ts` - 添加分页相关英文翻译
- `src/lib/locales/zh_CN.ts` - 添加分页相关中文翻译

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

## [2025-01-XX] - 移除特定标题标签

### 🎯 内容清理
- **移除特定标题**: 从HTML内容中自动移除 `<h1>AI新闻简报</h1>` 和 `<h2>AI新闻分类汇总</h2>` 及其英文变体
- **英文变体支持**: 同时移除 "AI News Brief"、"AI News Roundup"、"AI News Summary"、"AI News Categories" 等英文标题

### ✨ 功能增强
- **自动过滤**: 在 `removeTagsSection` 函数中添加标题移除逻辑
- **多语言支持**: 支持中文和英文标题的自动识别和移除
- **循环处理**: 在循环处理中优先移除这些标题，确保完全清理

### 📝 修改文件
- `src/app/issues/[slug]/page.tsx` - 在 `removeTagsSection` 函数中添加标题移除逻辑

### 🔧 技术实现
- 使用正则表达式匹配 `<h1>` 和 `<h2>` 标签中的特定文本
- 支持标签中的属性（如 `class`、`id` 等）
- 忽略空白字符，确保匹配的准确性

## [2025-01-XX] - 首页介绍文案更新：面向所有人，打破信息茧房

### 🎯 定位调整
- **目标受众扩展**: 从"AI工程师"扩展到"所有人"
- **核心使命**: 以打破每个人的信息茧房为目标
- **价值主张**: 强调压缩信息、节省时间、缓解焦虑

### ✨ 文案更新
**中文版本**:
- **副标题**: "每一个顶尖 AI 工程师都应该有的资讯获取方式" → "打破信息茧房，为每个人提供优质的行业资讯"
- **描述**: 新增"我们以打破每个人的信息茧房为目标，收集行业内的新闻，帮助大家压缩信息、节省时间、缓解焦虑"

**英文版本**:
- **副标题**: "Every top AI Engineer should have a way to keep up with the latest news." → "Break your information bubble with quality industry news for everyone."
- **描述**: 新增"We break information bubbles by collecting industry news to help everyone compress information, save time, and reduce anxiety."

### 📝 修改文件
- `src/app/page.tsx` - 更新页面元数据（title、description、Open Graph、Twitter Card）
- `src/lib/locales/zh_CN.ts` - 更新中文翻译（hero.subtitle、hero.description、siteTitle、siteDescription）
- `src/lib/locales/en.ts` - 更新英文翻译（hero.subtitle、hero.description、siteTitle、siteDescription）

### 🎨 内容特点
- **打破信息茧房**: 突出平台的使命是帮助用户突破信息局限
- **面向所有人**: 不再局限于AI工程师，欢迎所有对行业资讯感兴趣的用户
- **价值主张**: 明确强调压缩信息、节省时间、缓解焦虑三大核心价值
- **行业资讯**: 强调收集行业内的新闻，提供全面的信息覆盖

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
- **数据获取**: `getIssueSummaries()` 和 `getAiContentByJournalId()` API
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