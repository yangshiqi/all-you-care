# 独立邮件订阅入口 — 设计文档

**日期**: 2026-06-04
**状态**: 已批准，进入实现

## 背景

目前 AI 日报的订阅只能通过首页 `Hero.tsx` 里内嵌的订阅表单完成，全站没有任何导航/页脚链接指向订阅，也没有一个独立的订阅落地页（`/[lang]/subscribe` 目前只有 `/snow` 和 `/success` 两个子页）。邮件服务实际由 **Brevo** 承载（CLAUDE.md 里写的 HubSpot 已过时），首页表单直接 POST 到 Brevo 的 sibforms 表单端点（AI 频道），由 Brevo 发确认邮件并跳转到 success 页。

## 目标

给 AI 日报新增一个**单独的邮件订阅入口**，包含：
1. 一个独立的订阅落地页（复用 Hero 订阅框风格）
2. Header 导航栏 + 移动端菜单 + 站点级 Footer 三处入口链接

## 非目标 / 已定决策

- 不改动后端、Brevo 端点、success 页 —— 前端继续直接 POST 到现有 Brevo（AI 频道）表单端点。
- 不做非 `[lang]` 的裸 `/subscribe` 路由 fallback —— 所有入口链接都通过 `addLanguageToPath` 带语言前缀。
- 落地页用单栏居中布局，不复用 Hero 的双栏 + LiveLog，更聚焦转化。

## 模块设计

### ① 抽出可复用组件 `src/components/SubscribeBox.tsx`（重构 Hero）

把 `Hero.tsx` 第 39–151 行的订阅卡片（渐变背景 + "Escape the Algorithm" 标题栏 + 订阅人数徽章 + Brevo `<form>` + 隐私提示）抽成独立客户端组件 `SubscribeBox`。

- 沿用现有 `hero.*` i18n key，**首页视觉零变化**。
- `Hero.tsx` 改为引用 `<SubscribeBox />`，落地页复用同一组件，消除复制粘贴。
- 表单 `action` 仍为现有 Brevo AI 频道端点，`onSubmit` 仅置 `isSubmitting`，逻辑完全不变。
- 接口：组件自包含，无必需 props（可选 `className` 用于落地页微调外边距）。

### ② 新增落地页 `src/app/[lang]/subscribe/page.tsx`

服务端组件，与现有页面同构：

- `generateMetadata`：标题/描述取自 `subscribePage.metaTitle / metaDescription`，canonical = `/[lang]/subscribe`，复用站点 OG 图。
- `isValidLanguage(lang)` 守卫，非法语言 `notFound()`。
- 结构：`<div className="min-h-screen bg-background">` → `<Header initialLang={lang} />` → `<main>` 内 `paper-texture` 区：居中单栏，大标题（`subscribePage.title`）+ 副文案（`subscribePage.subtitle`）+ 3 个卖点小条（`subscribePage.benefit1/2/3`）+ 居中的 `<SubscribeBox>`（约 `max-w-lg`）。
- Footer 由 `[lang]/layout.tsx` 自动带上，页面无需自己渲染。

### ③ 新增站点级 `src/components/Footer.tsx`

客户端组件（`"use client"`），复古报纸风，顶部 `border-t-4 border-primary` 呼应 Header 的 `border-b-4`。接受可选 `initialLang` prop（与 Header 一致，回退到 `useCurrentLanguage`）。

内容：
- SnapAllx Logo（复用 Header 的 SVG）+ tagline（`footer.tagline`）。
- 导航列：Issues / Weekly / Tags / Subscribe（复用 `nav.*` key）。
- 紧凑订阅 CTA：`footer.subscribePrompt` 文案 + `footer.subscribeButton` 按钮 → `/subscribe`。
- 底部版权条：`footer.rights`（如 `© 2026 SnapAllx. All rights reserved.`）。

挂载：在 `src/app/[lang]/layout.tsx` 中将 `return <>{children}</>` 改为 `return <>{children}<Footer initialLang={lang} /></>`，全站 `[lang]/*` 生效。

### ④ Header 改动 `src/components/Header.tsx`

- 桌面导航 Tags 之后，新增**高亮按钮样式**的 Subscribe 入口（`bg-primary text-primary-foreground` 填充、`rounded`、`px/py`），从普通文字链接中跳出来。
- 移动端折叠菜单底部新增 Subscribe 链接（同样醒目，点击后关闭菜单）。
- 均指向 `addLanguageToPath("/subscribe", lang)`，文案用已存在的 `nav.subscribe`。

### ⑤ i18n（`src/lib/locales/en.ts` + `zh_CN.ts` 同步）

- `nav.subscribe`：**已存在**（"subscribe" / "订阅"），无需新增。
- 新增 `subscribePage`：`{ metaTitle, metaDescription, title, subtitle, benefit1, benefit2, benefit3 }`。
- 新增 `footer`：`{ tagline, subscribePrompt, subscribeButton, rights }`。

## 数据流

订阅落地页 / Hero / Footer 入口 → `<SubscribeBox>` 表单 POST 到 Brevo（AI 频道）→ Brevo 发确认邮件 + 跳转 `/subscribe/success`。无新增后端调用。

## 错误处理

复用现有 Hero 表单行为（Brevo 端校验 + 表单端点处理）；落地页/Footer 不引入新的错误路径。

## 验证

- `npm run build` 通过、`npm run lint` 通过。
- 浏览器核对：桌面 Header 按钮、移动端菜单项、Footer 三处入口可见且跳转正确；落地页桌面/移动端布局正常；首页 Hero 视觉无回归。

## 影响文件清单

| 文件 | 操作 |
|------|------|
| `src/components/SubscribeBox.tsx` | 新增（从 Hero 抽出） |
| `src/components/Hero.tsx` | 改为引用 SubscribeBox |
| `src/components/Footer.tsx` | 新增 |
| `src/components/Header.tsx` | 加 Subscribe 入口（桌面 + 移动） |
| `src/app/[lang]/subscribe/page.tsx` | 新增落地页 |
| `src/app/[lang]/layout.tsx` | 挂载 Footer |
| `src/lib/locales/en.ts` | 加 `subscribePage` + `footer` |
| `src/lib/locales/zh_CN.ts` | 加 `subscribePage` + `footer` |
