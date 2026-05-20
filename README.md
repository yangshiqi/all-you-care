# SnapAI News

[![License: AGPL v3](https://img.shields.io/github/license/yangshiqi/all-you-care?color=blue)](./LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/yangshiqi/all-you-care)](https://github.com/yangshiqi/all-you-care/commits)
[![Stars](https://img.shields.io/github/stars/yangshiqi/all-you-care?style=social)](https://github.com/yangshiqi/all-you-care/stargazers)

> **English** · [中文](./README.zh-CN.md)

> Don't let the algorithm decide what you see.

The internet is flooded with PR boilerplate and AI slop. SnapAI is a **noise-cancellation engine** that compresses dozens of signal sources into a single **5-minute daily digest**:

- **25+ hand-picked RSS feeds** — TechCrunch / The Verge / MIT Tech Review / a16z / PitchBook / 36kr and friends
- **Pulls from Hacker News's collective taste** — Live-subscribes via OPML to [@emschwartz's HN popular blogs gist](https://gist.github.com/emschwartz/e6d2bf860ccc367fe37ff953ba6de66b). Whatever HN is into, we follow automatically — **no source list to maintain by hand**.
- **A dozen developer newsletters** — Mailboxes the maintainer personally subscribes to

A multi-step LLM pipeline does the rest: fetch → compress → score → merge → render. We don't produce news; **we decompile truth**.

**[Read today's issue →](https://snapallx.com)** — thousands of engineers already plugged in

---

Repo layout: the top level is the Next.js + Supabase frontend; [`pipeline/`](./pipeline) is a standalone TypeScript content pipeline running on GitHub Actions.

## How it compares

| | SnapAI | Beehiiv / Substack | Roll your own (cron + LLM) |
|---|---|---|---|
| Content production | Fully automated pipeline (compress → score → merge → render) | You write it | You wire it |
| Subscriber ownership | 100% yours | Platform-hosted | Yours |
| Switch verticals | Fork + change source list | Open a new account | Start from scratch |
| LLM cost | Your own API key | Bundled in plan | Your key |

## Stack

**Frontend**
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (Radix Primitives)
- TanStack Query / next-themes / motion / sonner
- react-i18next (zh-CN / en bilingual)

**Data & Services**
- Supabase (Postgres + RLS) — sole persistence layer
- HubSpot — email subscription
- Vercel — hosting

**Content pipeline** (see [`pipeline/README.md`](./pipeline/README.md))
- TypeScript + tsx, running on GitHub Actions cron
- Anthropic Claude (compress / score / merge / render)
- Gmail IMAP (newsletter ingestion + cover image extraction)
- RSS / OPML / email — three source kinds

## Quick start

```bash
# 1. Install deps
npm install

# 2. Configure .env.local
cp .env.example .env.local   # then fill in SUPABASE / HUBSPOT keys

# 3. Start dev server (port 1717)
npm run dev
```

Open <http://localhost:1717>.

### Environment variables

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Server-side (for API routes)
SUPABASE_SERVICE_ROLE_KEY=...

# HubSpot email subscription (optional)
HUBSPOT_ACCESS_TOKEN=...

# Admin endpoint auth
ADMIN_TOKEN=...

# Sitemap / canonical URL (optional)
NEXT_PUBLIC_SITE_URL=https://snapallx.com
```

## Routes

| Path | Purpose |
|---|---|
| `/[lang]/` | Homepage: latest issue + history cards |
| `/[lang]/issues` | Paginated issue list |
| `/[lang]/issues/[slug]` | Issue detail (slug = `journal_id`) |
| `/[lang]/tags` | Tag index |
| `/[lang]/tags/[tag]` | Issues under one tag |
| `/[lang]/subscribe` | Email subscribe |
| `/admin` | Admin (token-auth) |

`[lang]` supports `zh-CN` / `en`. Root `/` redirects by browser `Accept-Language`.

### API

| Path | Purpose |
|---|---|
| `POST /api/subscribe` | HubSpot subscribe |
| `POST /api/send-campaign-email` | Admin broadcast |
| `POST /api/send-latest-ai-news` | Send today's issue to subscribers |
| `GET  /api/check-email-status` | Delivery status polling |
| `* /api/admin/*` | Admin ops (trigger deliver, pin issue, etc.) |

## Project layout

```
all-you-care/
├── src/
│   ├── app/
│   │   ├── [lang]/             # i18n routes
│   │   │   ├── issues/         # list / detail
│   │   │   ├── tags/           # tags
│   │   │   ├── subscribe/      # subscribe
│   │   │   └── layout.tsx
│   │   ├── admin/              # admin
│   │   ├── api/                # API routes
│   │   ├── sitemap.ts          # dynamic sitemap
│   │   └── providers.tsx       # Query / Theme / i18n providers
│   ├── components/             # UI components (Header, IssuesList, …)
│   │   └── ui/                 # shadcn/ui primitives
│   └── lib/
│       ├── api.ts              # all Supabase queries go through here
│       ├── supabase.ts         # client instance
│       ├── i18n.ts             # translation dict
│       └── i18n-utils.ts
├── pipeline/                   # ← standalone content pipeline subproject
└── .github/workflows/          # one workflow per pipeline step
```

## Data flow

```
                       ┌────────────────────────────┐
                       │  GitHub Actions cron       │
                       │  (.github/workflows/*.yml) │
                       └─────────────┬──────────────┘
                                     │
                       ┌─────────────▼──────────────┐
                       │  pipeline/  (npm run cli)  │
                       │                            │
                       │  fetch → compress → score  │
                       │     → merge → render       │
                       │     → publish (+ tags,     │
                       │     reutersImage, deliver) │
                       └─────────────┬──────────────┘
                                     │
                              writes ▼
                       ┌────────────────────────────┐
                       │     Supabase Postgres      │
                       └─────────────┬──────────────┘
                                     │  reads
                       ┌─────────────▼──────────────┐
                       │   Next.js (this repo)      │
                       │   src/lib/api.ts           │
                       └────────────────────────────┘
```

The frontend never calls an LLM or hits an RSS feed directly — every piece of content is produced by the pipeline and landed in Supabase first. The frontend does SSR + static rendering only.

## Deployment

Pushing to `main` auto-deploys to Vercel.

- Production: `main`
- Preview: any PR

Frontend env vars live in Vercel Project Settings. GitHub Actions secrets live separately under repo Settings → Secrets and variables → Actions.

## Docs

- [`pipeline/README.md`](./pipeline/README.md) — pipeline design, steps, local dev
- [`docs/2026-05-13-n8n-to-pipeline-design.md`](./docs/2026-05-13-n8n-to-pipeline-design.md) — full pipeline design doc
- [`CLAUDE.md`](./CLAUDE.md) — project notes for Claude Code

## Contributing

The fastest way in: pick a task from the [contribute page](https://github.com/yangshiqi/all-you-care/contribute) — GitHub auto-curates `good first issue` and `help wanted` items.

Bugs, ideas, design discussions → [open an issue](https://github.com/yangshiqi/all-you-care/issues).

## License

[AGPL-3.0-or-later](./LICENSE). In short:

- Use, modify, run internally — free
- Run it as a public service (SaaS / site) — you must publish your modifications under AGPL too
- Want out of that obligation — contact the author for a commercial license
