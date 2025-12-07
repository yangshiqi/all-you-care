# 语言参数传递问题修复

**日期**: 2025-01-XX  
**问题**: `/zh-CN/issues/93` URL 的语言判断逻辑不正确  
**状态**: ✅ 已修复

## 🔍 问题分析

### 问题描述

访问 `/zh-CN/issues/93` 时，虽然 URL 路径中包含 `zh-CN` 语言参数，但在获取数据时**没有传递语言参数**，导致可能返回错误语言版本的数据。

### 问题根源

在 `src/app/[lang]/issues/[slug]/page.tsx` 文件中：

1. **`getIssueData` 函数**（第 52 行）只接受 `slug` 参数，没有 `lang` 参数
2. **调用 `getAiContentByJournalId`**（第 55 行）时没有传递语言参数
3. **调用 `getIssueData`** 的地方（第 206 行和第 276 行）也没有传递 `lang` 参数

### 问题代码

```typescript
// ❌ 修复前
async function getIssueData(slug: string) {
  const supabaseData = await getAiContentByJournalId(slug); // 没有传递 lang
  // ...
}

// 调用时
const issue = await getIssueData(slug); // 没有传递 lang
```

### 影响范围

- **`generateMetadata` 函数**: 生成元数据时可能使用错误语言的数据
- **`IssueDetailPage` 组件**: 显示内容时可能显示错误语言版本
- **数据一致性**: URL 语言与显示内容不匹配

## ✅ 修复方案

### 修复内容

1. **修改 `getIssueData` 函数签名**，添加 `lang` 参数
2. **在调用 `getAiContentByJournalId` 时传递 `lang` 参数**
3. **在所有调用 `getIssueData` 的地方传递 `lang` 参数**

### 修复后的代码

```typescript
// ✅ 修复后
async function getIssueData(slug: string, lang?: string) {
  const supabaseData = await getAiContentByJournalId(slug, lang); // 传递 lang
  // ...
}

// 调用时
const issue = await getIssueData(slug, lang); // 传递 lang
```

### 修复位置

**文件**: `src/app/[lang]/issues/[slug]/page.tsx`

1. **第 52 行**: 修改函数签名，添加 `lang?: string` 参数
2. **第 55 行**: 调用 `getAiContentByJournalId` 时传递 `lang` 参数
3. **第 206 行**: `generateMetadata` 中调用 `getIssueData` 时传递 `lang` 参数
4. **第 276 行**: `IssueDetailPage` 中调用 `getIssueData` 时传递 `lang` 参数

## 🔄 语言映射流程

### URL 到数据库语言的映射

```
URL: /zh-CN/issues/93
  ↓
路由参数: lang = "zh-CN"
  ↓
getIssueData(slug, "zh-CN")
  ↓
getAiContentByJournalId(slug, "zh-CN")
  ↓
mapI18nLangToDbLang("zh-CN")
  ↓
数据库查询: lang = "zh_CN"
```

### 语言映射函数

```typescript
function mapI18nLangToDbLang(i18nLang: string | undefined): string | undefined {
  if (!i18nLang) return undefined
  if (i18nLang === 'zh-CN' || i18nLang === 'zh') return 'zh_CN'
  if (i18nLang.startsWith('en')) return 'en'
  return undefined
}
```

**映射规则**:
- `zh-CN` → `zh_CN` (数据库格式)
- `zh` → `zh_CN` (兼容旧格式)
- `en` → `en` (保持不变)

## ✅ 验证结果

### 修复后的行为

1. **访问 `/zh-CN/issues/93`**:
   - URL 解析: `lang = "zh-CN"`, `slug = "93"`
   - 数据查询: `journal_id = "93" AND lang = "zh_CN"`
   - 返回: 中文版本的数据

2. **访问 `/en/issues/93`**:
   - URL 解析: `lang = "en"`, `slug = "93"`
   - 数据查询: `journal_id = "93" AND lang = "en"`
   - 返回: 英文版本的数据

### 数据获取逻辑

在 `getAiContentByJournalId` 函数中（`src/lib/api.ts` 第 138-180 行）：

```typescript
export async function getAiContentByJournalId(journalId: string, i18nLang?: string) {
  const dbLang = mapI18nLangToDbLang(i18nLang)
  
  // 优先按语言查找
  if (dbLang) {
    const { data: langData, error: langError } = await supabase
      .from('n8n-ai-contents')
      .select('*')
      .eq('journal_id', journalId)
      .eq('lang', dbLang)  // 按语言过滤
      .single()
    
    if (!langError && langData) {
      return langData
    }
  }
  
  // 如果语言版本不存在，回退到非语言限定的查询
  // ...
}
```

**优先级**:
1. 优先查找指定语言版本的数据
2. 如果指定语言版本不存在，回退到非语言限定的查询（兼容旧数据）

## 📝 相关文件

- `src/app/[lang]/issues/[slug]/page.tsx` - 期刊详情页（已修复）
- `src/lib/api.ts` - API 函数（语言映射逻辑已存在）
- `src/lib/i18n-utils.ts` - 语言工具函数

## 🎯 总结

### 修复前的问题

- ❌ URL 中的语言参数没有被使用
- ❌ 可能返回错误语言版本的数据
- ❌ URL 语言与显示内容不匹配

### 修复后的改进

- ✅ URL 语言参数正确传递到数据查询
- ✅ 确保返回正确语言版本的数据
- ✅ URL 语言与显示内容一致
- ✅ 支持多语言内容的正确显示

### 测试建议

1. 访问 `/zh-CN/issues/93`，验证显示中文内容
2. 访问 `/en/issues/93`，验证显示英文内容
3. 验证元数据（title, description）使用正确语言
4. 验证 hreflang 标签正确设置

---

**修复状态**: ✅ 已完成  
**测试状态**: ⏳ 待测试

