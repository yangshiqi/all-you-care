# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**all-you-care** (package name: `ainews`) — AI news aggregation platform for engineers. Newspaper-style UI presenting daily AI news curated via n8n automation workflows into Supabase. Deployed on Vercel.

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
- **Supabase** — sole data backend (table: `n8n-ai-contents`)
- **react-i18next** — i18n with `zh-CN` and `en` locales
- **TanStack Query** — client-side data fetching
- **motion** (Framer Motion) — animations
- **next-themes** — dark/light mode

## Architecture

### Routing & i18n

The app uses a `[lang]` dynamic segment for i18n routing:
- `/[lang]/` — homepage with recent issues
- `/[lang]/issues` — paginated issue list
- `/[lang]/issues/[slug]` — issue detail (slug = `journal_id`)
- `/[lang]/tags` — tag listing
- `/[lang]/subscribe` — email subscription

Root `layout.tsx` provides global styles/providers; `[lang]/layout.tsx` handles locale-specific metadata and HTML lang attribute.

### Data Flow

All content comes from the Supabase `n8n-ai-contents` table (populated externally by n8n workflows). The data layer is in `src/lib/api.ts` — all queries go through the Supabase client in `src/lib/supabase.ts`. Language filtering maps i18n locales to DB `lang` values (`zh-CN` → `zh_CN`, `en-*` → `en`).

### API Routes (`src/app/api/`)

- `subscribe/` — HubSpot email subscription
- `send-campaign-email/`, `send-latest-ai-news/`, `check-email-status/` — email campaign management

### Key Files

- `src/lib/api.ts` — all Supabase queries and data types (`IssueSummary`, `PaginatedResult`, `TagSummary`)
- `src/lib/i18n.ts` — i18n configuration and translation strings
- `src/lib/i18n-utils.ts` — i18n helper utilities
- `src/components/ui/` — shadcn/ui primitives

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase connection
- `HUBSPOT_ACCESS_TOKEN` — email subscription (optional)
- `NEXT_PUBLIC_SITE_URL` — for sitemap generation (optional)
