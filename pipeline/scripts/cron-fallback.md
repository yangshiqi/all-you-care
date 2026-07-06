# Cron fallback via cron-job.org

## Why

GitHub Actions scheduled workflows are unreliable during peak periods —
dropped and delayed runs are documented behavior. We saw a 3+ hour outage
in the hourly AI chain on 2026-05-18. cron-job.org is a free third-party
scheduler we use as a redundant trigger. The actual work still runs on
GitHub-hosted runners; cron-job.org just fires a `workflow_dispatch` HTTP
call on schedule.

## One-time setup

1. **Create a GitHub fine-grained PAT**
   - Settings → Developer settings → Personal access tokens → Fine-grained
   - Repository access: `yangshiqi/all-you-care` only
   - Permissions: **Actions: Read and write**, **Contents: Read**, **Metadata: Read**
   - Copy the token (starts with `github_pat_…`)

2. **Sign up at cron-job.org** (free tier — 50 jobs, 1-min granularity)
   - https://cron-job.org → register
   - Console → Settings → API Keys → Create new key

3. **Run the setup script**

   ```fish
   cd pipeline
   set -x CRONJOB_TOKEN <your cron-job.org API key>
   set -x GITHUB_TOKEN  <your github fine-grained PAT>
   ./node_modules/.bin/tsx scripts/setup-cronjob-fallback.ts
   ```

   (bash equivalent: `CRONJOB_TOKEN=… GITHUB_TOKEN=… npx tsx scripts/setup-cronjob-fallback.ts`)

   The script is idempotent — re-running it skips jobs whose title already
   exists. To re-create a job, delete it in the cron-job.org console first.

## What gets created

| Title | Cron (UTC) | Triggers |
|---|---|---|
| `[fallback] ai · fetch (hourly)` | `0 * * * *` | `ai-fetch.yml` |
| `[fallback] ai · compress (every 3h +10)` | `10 */3 * * *` | `ai-compress.yml` |
| `[fallback] ai · score (every 3h +40)` | `40 */3 * * *` | `ai-score.yml` |
| `[fallback] ai · reuters-image (07:00 SH)` | `0 23 * * *` | `reuters-image.yml` |
| `[fallback] ai · publish-pipeline (Mon–Sat 08:30 SH)` | `30 0 * * 1-6` | `ai-publish.yml` (merge→render→publish→deliver) |
| `[fallback] ai · weekly-digest (Sun 08:30 SH)` | `30 0 * * 0` | `ai-weekly.yml` (weekly→publish→deliver) |
| `[fallback] ai · tags (09:00 SH)` | `0 1 * * *` | `ai-tags.yml` |
| `[fallback] infra · fetch (06:00 SH)` | `0 22 * * *` | `infra-fetch.yml` |
| `[fallback] infra · compress (06:20 SH)` | `20 22 * * *` | `infra-compress.yml` |
| `[fallback] infra · score (06:40 SH)` | `40 22 * * *` | `infra-score.yml` |
| `[fallback] infra · weekly (Mon 09:00 SH)` | `0 1 * * 1` | `infra-weekly.yml` (merge→render) |

infra (AI 基建周报) is a weekly channel: fetch/compress/score accumulate daily,
merge→render assembles once a week on Monday. No publish/deliver yet — the weekly
run produces a reviewable `pre_publish`. infra merge does per-item LLM expands, so
`infra-weekly.yml` passes `timeout: 30` to the reusable workflow (default is 10).

Snow channel is not currently in active use — its entries are commented
out in `setup-cronjob-fallback.ts`. Uncomment them and rerun the script
if Snow goes live.

## Double-fire risk

Both GitHub's built-in schedule and cron-job.org will fire each workflow.
The pipeline steps tolerate this:

- `fetch`: DB unique constraint on title dedup — second run inserts nothing
- `compress` / `score`: claim/release locks — second run finds nothing to claim
- `publish-pipeline`: the merge prompt's `old_titles` check prevents
  duplicate issues

Cost: a few wasted runner minutes per duplicate. Worth it for the
reliability gain. If you want to eliminate doubles, remove the `schedule:`
block from each workflow YAML once cron-job.org is verified working.

## Verifying

After setup, watch the cron-job.org console → Job History. Each job
should fire on schedule and return HTTP 204 from GitHub (which is the
success code for `workflow_dispatch`). The corresponding GitHub Actions
run will appear with event = `workflow_dispatch`.

## Free-tier limits and operational notes

Cron-job.org adjusts these periodically — verify the current numbers in
the Console before assuming. Snapshot as of 2026-05:

| Dimension | Free tier | Our usage | Headroom |
|---|---|---|---|
| Jobs per account | 50 | 6 | ample |
| Minimum interval | 1 min | hourly | irrelevant |
| Request timeout | 30 s | < 1 s (GitHub returns 204 immediately) | irrelevant |
| Body size | undocumented, ≥ 8 KB works | 16 bytes (`{"ref":"main"}`) | irrelevant |
| Execution history retention | ~30 days per job | sufficient for triage |
| Failure notifications | email | enabled (`onFailure`) | sufficient |
| API access | full | used by setup script | sufficient |
| API create-rate | not published; we observed 429s after ~6 burst PUTs | one-time setup | known issue, mitigated |

Watch-outs:

1. **Account hibernation.** Free accounts that go un-logged-in for ~1-2 months
   may auto-disable jobs. Bookmark the console and glance once a month.
2. **Truncated response logs.** Free tier truncates saved responses to ~1 KB.
   GitHub `workflow_dispatch` returns an empty body, so this only matters when
   debugging an endpoint that returns a verbose error.
3. **Aggregate stats limited to 7 days.** Per-job history goes further back,
   but the success-rate dashboard view only covers the last week.
4. **Shared-worker fire latency.** Free jobs run on a shared cluster. Doc
   promise is "within a minute of scheduled time." We've observed 20-40 s
   typical delays. They do not skip — only delay.
5. **API burst limit.** Recreating all jobs at once (e.g. after rotating a
   PAT) needs ≥ 5 s spacing between PUTs to avoid 429. The setup script
   uses 1.5 s and survives small batches via try/catch; for full rebuilds,
   bump the spacing in the script or just rerun (idempotent).
