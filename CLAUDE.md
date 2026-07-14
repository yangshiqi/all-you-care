# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**all-you-care** (package name: `ainews`) — AI news aggregation platform for engineers. Newspaper-style UI presenting a daily AI news channel plus an AI-infra weekly channel, curated via n8n automation workflows into Supabase. Deployed on Vercel.

## Commands

```bash
npm run dev          # Dev server on port 1717
npm run build        # Production build
npm run lint         # ESLint (flat config, next/core-web-vitals + typescript)
npm run test-build   # Build validation script
```

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/postcss`) + **shadcn/ui** components
- **Supabase** — sole data backend (table: `issues`, rows split by a `channel` column: `ai` = daily news, `infra` = AI-infra weekly)
- **react-i18next** — i18n with `zh-CN` and `en` locales
- **TanStack Query** — client-side data fetching
- **motion** (Framer Motion) — animations
- **next-themes** — dark/light mode

## Architecture

### Routing & i18n

The app uses a `[lang]` dynamic segment for i18n routing:
- `/[lang]/` — homepage with recent issues
- `/[lang]/issues` — paginated list (channel `ai`); `/[lang]/issues/[slug]` — detail (slug = `journal_id`)
- `/[lang]/infra` — AI-infra weekly list (channel `infra`); `/[lang]/infra/[slug]` — detail
- `/[lang]/tags` — tag listing; `/[lang]/tags/[tag]` — per-tag issues
- `/[lang]/subscribe`, `/[lang]/subscribe/snow` — Brevo subscription; `/[lang]/weekly` — weekly view
- `/admin/login`, `/admin/issues` + `/api/admin/*` — token-gated admin (`ADMIN_TOKEN`, `force-dynamic`)

Root `layout.tsx` provides global styles/providers; `[lang]/layout.tsx` handles locale-specific metadata and HTML lang attribute.

### Data Flow

All content comes from the Supabase `issues` table (populated externally by n8n workflows), with rows split by `channel` (`ai` daily / `infra` weekly). The data layer is in `src/lib/api.ts` — all queries go through the Supabase client in `src/lib/supabase.ts`. Language filtering maps i18n locales to DB `lang` values (`zh-CN` → `zh_CN`, `en-*` → `en`) via `mapI18nLangToDbLang`.

### Rendering & caching (gotcha)

Content list pages (`/[lang]`, `/[lang]/issues`, `/[lang]/infra`, `/[lang]/tags`) are SSG with 24h ISR (`export const revalidate = 86400`). **New Supabase content only appears after the ISR window elapses or a redeploy** — before adding ISR, list pages were static-forever and froze between deploys. If content is missing from the live site, check cache headers (`x-vercel-cache`, `age`, `x-nextjs-prerender`) and last-deploy time before suspecting the n8n/Supabase pipeline. Detail pages use `generateStaticParams` with default `dynamicParams=true`, so new slugs render on-demand.

### API Routes (`src/app/api/`)

- `subscribe/` — Brevo Contacts API subscription (`BREVO_API_KEY`); the hosted `subscribe/snow` form also posts directly to a Brevo/sibforms endpoint
- `send-campaign-email/`, `send-latest-ai-news/`, `check-email-status/` — email campaign management
- `admin/login/`, `admin/deliver/` — token-gated admin actions (`ADMIN_TOKEN`)

### Key Files

- `src/lib/api.ts` — all Supabase queries and data types (`IssueSummary`, `PaginatedResult`, `TagSummary`)
- `src/lib/i18n.ts` — i18n configuration; translation strings live in `src/lib/locales/{en,zh_CN}.ts`
- `src/lib/i18n-utils.ts` — i18n helper utilities (`isValidLanguage`, `addLanguageToPath`)
- `src/components/ui/` — shadcn/ui primitives

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase connection (app uses the anon client; no service-role key in app code)
- `BREVO_API_KEY` / `BREVO_LIST_ID` — email subscription (optional)
- `ADMIN_TOKEN` — gate for `/admin/*` and `/api/admin/*` (optional)
- `NEXT_PUBLIC_SITE_URL` — for sitemap generation (optional)
