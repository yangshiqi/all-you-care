# pipeline

> **English** · [中文](./README.zh-CN.md)

A content pipeline for people who've had it with n8n / Dify / Coze. Drag-and-drop workflows are fast to ship and brittle to run — debugging is painful, versioning is chaos, anything mildly complex breaks silently in the middle of the night. We moved the same logic into TypeScript: scheduling lives in cron, state lives in the database, errors live in logs.

Every day it pulls RSS + email subscriptions → compresses, scores, and merges with Claude → renders an HTML newspaper → writes to Supabase for the frontend. Running in production at [snapallx.com](https://snapallx.com).

> Full design doc: [`docs/2026-05-13-n8n-to-pipeline-design.md`](../docs/2026-05-13-n8n-to-pipeline-design.md)

## Channels

Each channel = one `src/channels/<name>/config.yaml` + a set of prompts. Adding a channel is a config-only change.

| Channel | Status | Content |
|---|---|---|
| `ai` | active | AI engineering daily, ships 08:30 CST every day |
| `snow` | manual only | Snowboarding news, cron disabled |

## Source strategy

The `ai` channel pulls from three complementary kinds of sources:

| Kind | Count | How it's maintained |
|---|---|---|
| RSS | ~25 | Static list in `config.yaml`, hand-curated |
| **OPML subscription** | dynamic | Pulls [`emschwartz/hn-popular-blogs-2025`](https://gist.github.com/emschwartz/e6d2bf860ccc367fe37ff953ba6de66b) — **someone else maintains it, we auto-follow**. Whatever HN is into shows up in our feed list. |
| Newsletter (email) | ~12 | Gmail IMAP filtered by sender; add a newsletter by editing `sources.email` in `config.yaml` |

The OPML strategy is the most fork-friendly trick here: instead of hand-maintaining 100 RSS URLs, subscribe to a high-quality OPML gist and let someone else do the curation. The same approach works for any vertical (finance / design / engineering blogs) — find a curated OPML list and point at it.

## Steps

The main chain is six steps:

```
fetch → compress → score → merge → render → publish
```

Helper steps: `tags` (tag aggregation), `reutersImage` (Reuters Daily Briefing cover extraction), `deliver` (subscriber broadcast).

| Step | What it does | Main dependency |
|---|---|---|
| `fetch` | Dispatches to `fetchRss` + `fetchEmail` | RSS parser / IMAP |
| `fetchRss` | Pulls RSS / OPML, writes `news_items` | rss-parser |
| `fetchEmail` | Pulls newsletters from Gmail IMAP | imapflow / mailparser |
| `compress` | LLM-compresses multiple items from one source into a single draft | Anthropic Claude |
| `score` | LLM-scores each draft + adds persona tags | Anthropic Claude |
| `merge` | Merges scored drafts, dedups, generates the issue outline | Anthropic Claude |
| `render` | Renders the issue HTML (Juice CSS inlining) + picks a cover image | Claude + Juice |
| `publish` | Writes to the `issues` table; optional preview email | nodemailer |
| `tags` | Extracts tags into `tags` / `issue_tags` | Claude |
| `reutersImage` | Extracts images from Reuters mail into the cover pool | IMAP + Claude Haiku |
| `deliver` | Calls the external endpoint to broadcast to subscribers | fetch |

## Scheduling

Each pipeline step corresponds to one workflow file, all of which call into the reusable `_pipeline.yml` workflow (which runs `npm run cli -- <channel> <step>` in the `pipeline/` subdir).

**`ai` channel cron** (UTC, with Asia/Shanghai conversion):

| Workflow | Cron | Asia/Shanghai |
|---|---|---|
| `ai-fetch.yml` | `0 * * * *` | every hour on the hour |
| `ai-compress.yml` | `10 * * * *` | every hour at :10 |
| `ai-score.yml` | `20 * * * *` | every hour at :20 |
| `ai-publish.yml` | `30 0 * * *` | daily 08:30 (chains merge → render → publish) |
| `ai-tags.yml` | `0 1 * * *` | daily 09:00 |
| `reuters-image.yml` | `0 23 * * *` | daily 07:00 |
| `ai-deliver.yml` | manual only | — |

GitHub schedule is occasionally flaky, so there's also a cron-job.org fallback (see [`scripts/cron-fallback.md`](./scripts/cron-fallback.md)).

## Running locally

```bash
cp .env.example .env.local   # fill in keys
npm install
npm run cli -- ai fetch            # run a single step
npm run cli -- ai score --dry-run  # dry-run (no DB writes, no LLM calls)
npm run cli -- ai score --limit 5  # cap the batch size
npm run cli -- ai score --verbose  # turn on debug logging
```

CLI flags:

| Flag | Effect |
|---|---|
| `--dry-run` | No DB writes, no LLM calls. Claimed rows are released. |
| `--limit N` | Override the channel's batch size |
| `--verbose` | Enable debug-level logs |

If `.env.local` doesn't exist, env is read from the process environment (GitHub Actions uses Secrets).

## Environment variables

| Key | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side key (bypasses RLS) |
| `ANTHROPIC_API_KEY` | Claude API key |
| `ANTHROPIC_BASE_URL` | Optional; set when proxying through a self-hosted / Bedrock endpoint |
| `GMAIL_USER` | Gmail IMAP user |
| `GMAIL_APP_PASSWORD` | Gmail App Password |
| `PREVIEW_EMAIL_TO` | Optional; `publish` sends a preview email to this address |

Optional fallback:

| Key | Purpose |
|---|---|
| `LLM_PROVIDER` | `anthropic` (default) / `claude_cli` / `codex_cli`. All three implement the same interface — useful for local dev without an API key. |
| `CODEX_MODEL` | Model to use when `LLM_PROVIDER=codex_cli` |

## Database tables

Main tables (full schema in design doc §3):

- `news_items` — fetch landing, flows through `(channel, status, claim_id)`
- `drafts` — compress output, flows into merge after score
- `issues` — finished daily, what the frontend reads
- `tags` / `issue_tags` — tag associations
- `cover_images` — Reuters cover image pool, `pickCoverImage` picks by ascending `used_count`

## Configuration

Example `src/channels/<name>/config.yaml` (excerpt from `ai`):

```yaml
name: ai
display_name: "AI Daily"
sources:
  rss:    [ { url: "https://...", enabled: true }, ... ]
  opml:   [ { url: "https://...", enabled: true } ]
  email:  [ "newsletter@example.com", ... ]
windows:
  fetch_rss_age_hours: 4
  compress_lookback_hours: 12
  merge_new_lookback_hours: 72
thresholds:
  compress_min_pending: 5
  compress_batch_size: 100
  score_batch_size: 10
cover_image:
  prefer: reuters_pool
  cdn_pattern: "https://www.snapallx.com/ainews/{yyyymm}/{n}.jpg"
  default: "/ainews/default.jpg"
deliver:
  url: "https://www.snapallx.com/api/send-latest-ai-news?type=ai"
llm:
  model: "claude-sonnet-4-6"
  max_tokens: 16000
  temperature: 0
```

Prompts live alongside config as `prompts/{compress,score,merge,render}.md`. `loadPrompt` injects template variables at runtime.

## Tests & lint

```bash
npm test           # vitest
npm run lint       # tsc --noEmit (lint here means type-check)
```

CI: `.github/workflows/pipeline-ci.yml` runs both on every PR.

## Troubleshooting

- **A step keeps failing.** Check `news_items` / `drafts` for claimed-but-not-committed rows (`claim_id IS NOT NULL`) — usually left behind by a previous crash. Release with `UPDATE ... SET claim_id = NULL, status = 'pending'`.
- **LLM calls keep aborting.** Default goes through the Anthropic SDK with a 600s timeout; if it still times out, check the `ANTHROPIC_BASE_URL` proxy. The SDK path has exponential backoff (1s / 4s / 16s).
- **Proxy occasionally returns a JSON string.** `lib/llm.ts` has unwrap logic. If a different shape ever shows up, you'll see `malformed llm response: ...; resp=<preview>` in the structured logs.
- **Reuters cover pool stops refreshing.** `reutersImage` searches `[Gmail]/All Mail` rather than INBOX, with subject-based DB dedup — if you trashed the email it won't be picked up (this is intentional).
- **GitHub Actions schedule misses.** There's a cron-job.org fallback documented in `scripts/cron-fallback.md`.

## Source layout

```
pipeline/
├── src/
│   ├── cli.ts                 # entry point — parses channel/step, dispatches to steps/
│   ├── channels/
│   │   ├── load.ts            # loads + validates channel config
│   │   ├── types.ts           # zod schema
│   │   ├── ai/                # config + prompts
│   │   └── snow/
│   ├── steps/                 # one file per step, each exports run(ctx)
│   │   ├── fetch.ts ...
│   ├── lib/
│   │   ├── db.ts              # Supabase + claim/commit helpers
│   │   ├── llm.ts             # Anthropic / CLI fallback
│   │   ├── imap.ts            # Gmail IMAP
│   │   ├── prompt.ts          # prompt loader + variable injection
│   │   ├── coverImage.ts      # cover image selection
│   │   ├── eventDedup.ts      # cross-source dedup in merge
│   │   ├── linkCanonical.ts   # URL canonicalization
│   │   └── ...
│   └── ...
├── scripts/
│   ├── import-legacy-issues.ts   # one-off: import old n8n tables
│   ├── opml-smoke.ts             # OPML parser smoke test
│   ├── setup-cronjob-fallback.ts # configure cron-job.org fallback
│   └── cron-fallback.md
├── .env.example
└── package.json
```

## Design decisions in brief

From the design doc (full version linked above):

- **No external alerting.** Failures are absorbed by idempotent state-bit retries; the only health signal you really need is "does the `issues` table get a new row every day".
- **Claim/commit template.** Each step does `UPDATE ... RETURNING` to grab a batch under its own `claim_id`, then commits state on success. Two workers can never process the same row.
- **Untrusted-items wrapping.** Every external snippet sent to the LLM is wrapped in `<untrusted_item>` tags, with the prompt explicitly instructing the model to ignore any instructions inside. Prompt-injection defense.
- **Channel isolation.** The `channel` column is a hard partition across all tables — merge / render / publish only ever look at their own channel.

## License

[AGPL-3.0-or-later](../LICENSE). Forking to run your own channel (finance / sports / any vertical daily) is totally fine; if you serve a modified version publicly you'll need to publish the changes under AGPL too. Commercial licensing available on request.
