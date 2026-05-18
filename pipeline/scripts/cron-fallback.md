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
| `[fallback] ai · compress (hourly+10)` | `10 * * * *` | `ai-compress.yml` |
| `[fallback] ai · score (hourly+20)` | `20 * * * *` | `ai-score.yml` |
| `[fallback] ai · reuters-image (07:00 SH)` | `0 23 * * *` | `reuters-image.yml` |
| `[fallback] ai · publish-pipeline (08:30 SH)` | `30 0 * * *` | `ai-publish.yml` |
| `[fallback] ai · tags (09:00 SH)` | `0 1 * * *` | `ai-tags.yml` |

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
