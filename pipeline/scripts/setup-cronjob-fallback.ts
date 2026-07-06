/* eslint-disable no-console */
//
// Register fallback cron jobs at cron-job.org that hit GitHub's
// `workflow_dispatch` endpoint for each pipeline workflow.
//
// Why this exists: GitHub Actions scheduled workflows are documented to be
// unreliable during peak periods (delays and dropped runs are common). A
// 3-hour outage in the hourly chain was observed on 2026-05-18. cron-job.org
// is a free third-party service whose only job is firing HTTP requests on
// schedule — much more reliable for the trigger side, while the real work
// still runs on GitHub-hosted runners.
//
// Usage
// -----
//   cd pipeline
//   CRONJOB_TOKEN=<from console.cron-job.org → Settings → API Keys> \
//   GITHUB_TOKEN=<PAT with `workflow` scope on this repo> \
//   ./node_modules/.bin/tsx scripts/setup-cronjob-fallback.ts
//
// The script is idempotent-by-title: it lists existing jobs first and skips
// any whose title already matches.

interface ScheduleSpec {
  workflow: string; // .github/workflows/<file>
  cron: string; // 5-field cron in UTC
  title: string;
}

const REPO_OWNER = 'yangshiqi';
const REPO_NAME = 'all-you-care';
const TITLE_PREFIX = '[fallback] ';

// Keep these crons in sync with .github/workflows/*.yml. Drift caused real
// pain on 2026-05-21: GH was relaxed to every-3h compress/score, cron-job.org
// kept firing hourly, and the per-3h cost-cut intent was silently negated.
const JOBS: ScheduleSpec[] = [
  { workflow: 'ai-fetch.yml', cron: '0 * * * *', title: 'ai · fetch (hourly)' },
  { workflow: 'ai-compress.yml', cron: '10 */3 * * *', title: 'ai · compress (every 3h +10)' },
  { workflow: 'ai-score.yml', cron: '40 */3 * * *', title: 'ai · score (every 3h +40)' },
  { workflow: 'reuters-image.yml', cron: '0 23 * * *', title: 'ai · reuters-image (07:00 SH)' },
  // Daily issue Mon–Sat; Sunday is replaced by the weekly digest below.
  { workflow: 'ai-publish.yml', cron: '30 0 * * 1-6', title: 'ai · publish-pipeline (Mon–Sat 08:30 SH)' },
  { workflow: 'ai-weekly.yml', cron: '30 0 * * 0', title: 'ai · weekly-digest (Sun 08:30 SH)' },
  { workflow: 'ai-tags.yml', cron: '0 1 * * *', title: 'ai · tags (09:00 SH)' },
  // infra (AI 基建周报) — weekly channel: accumulate daily, assemble on Monday.
  { workflow: 'infra-fetch.yml', cron: '0 22 * * *', title: 'infra · fetch (06:00 SH)' },
  { workflow: 'infra-compress.yml', cron: '20 22 * * *', title: 'infra · compress (06:20 SH)' },
  { workflow: 'infra-score.yml', cron: '40 22 * * *', title: 'infra · score (06:40 SH)' },
  // Weekly merge→render (no publish/deliver yet — output is a reviewable pre_publish).
  { workflow: 'infra-weekly.yml', cron: '0 1 * * 1', title: 'infra · weekly (Mon 09:00 SH)' },
  // Snow channel not currently in active use — add these back if it goes live:
  // { workflow: 'snow-fetch.yml', cron: '0 1,11 * * *', title: 'snow · fetch (09:00 / 19:00 SH)' },
  // { workflow: 'snow-compress.yml', cron: '0 */6 * * *', title: 'snow · compress (every 6h)' },
  // { workflow: 'snow-publish.yml', cron: '0 12 * * 2,5', title: 'snow · publish-pipeline (Tue/Fri 20:00 SH)' },
];

interface CronJobSchedule {
  timezone: string;
  expiresAt: number;
  minutes: number[];
  hours: number[];
  mdays: number[];
  months: number[];
  wdays: number[];
}

function expandField(expr: string, range: [number, number]): number[] {
  if (expr === '*') return [-1];
  const [lo, hi] = range;
  if (expr.startsWith('*/')) {
    const step = Number(expr.slice(2));
    if (!Number.isInteger(step) || step <= 0) {
      throw new Error(`invalid step in cron field: ${expr}`);
    }
    const out: number[] = [];
    for (let i = lo; i <= hi; i += step) out.push(i);
    return out;
  }
  const out: number[] = [];
  for (const p of expr.split(',')) {
    const match = p.match(/^(\d+)-(\d+)$/);
    if (match) {
      const a = Number(match[1]);
      const b = Number(match[2]);
      if (a < lo || b > hi || a > b) {
        throw new Error(`out-of-range cron range: ${p} (expected ${lo}..${hi})`);
      }
      for (let i = a; i <= b; i++) out.push(i);
      continue;
    }
    if (!/^\d+$/.test(p)) {
      throw new Error(`invalid cron value: "${p}"`);
    }
    const n = Number(p);
    if (n < lo || n > hi) {
      throw new Error(`out-of-range cron value: ${p} (expected ${lo}..${hi})`);
    }
    out.push(n);
  }
  return out;
}

function parseCron(expr: string): CronJobSchedule {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error(`cron must have 5 fields, got: ${expr}`);
  const [m, h, dom, mo, dow] = parts as [string, string, string, string, string];
  return {
    timezone: 'UTC',
    expiresAt: 0,
    minutes: expandField(m, [0, 59]),
    hours: expandField(h, [0, 23]),
    mdays: expandField(dom, [1, 31]),
    months: expandField(mo, [1, 12]),
    wdays: expandField(dow, [0, 6]),
  };
}

interface ExistingJob {
  jobId: number;
  title: string;
  enabled: boolean;
}

async function listExistingJobs(cjToken: string): Promise<ExistingJob[]> {
  const res = await fetch('https://api.cron-job.org/jobs', {
    headers: { Authorization: `Bearer ${cjToken}` },
  });
  if (!res.ok) {
    throw new Error(`cron-job.org list failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { jobs: ExistingJob[] };
  return data.jobs ?? [];
}

async function createJob(
  cjToken: string,
  ghToken: string,
  spec: ScheduleSpec,
): Promise<number> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${spec.workflow}/dispatches`;
  const body = {
    job: {
      url,
      enabled: true,
      saveResponses: true,
      title: TITLE_PREFIX + spec.title,
      requestMethod: 1, // POST
      requestTimeout: 30,
      extendedData: {
        headers: {
          Authorization: `Bearer ${ghToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: '{"ref":"main"}',
      },
      schedule: parseCron(spec.cron),
      notification: { onFailure: true, onSuccess: false, onDisable: true },
    },
  };
  const res = await fetch('https://api.cron-job.org/jobs', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${cjToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(
      `cron-job.org create failed for ${spec.workflow}: ${res.status} ${await res.text()}`,
    );
  }
  const data = (await res.json()) as { jobId: number };
  return data.jobId;
}

async function main(): Promise<void> {
  const cjToken = process.env.CRONJOB_TOKEN?.trim();
  const ghToken = process.env.GITHUB_TOKEN?.trim();
  if (!cjToken) throw new Error('CRONJOB_TOKEN env var is required');
  if (!ghToken) throw new Error('GITHUB_TOKEN env var is required (needs `workflow` scope)');

  console.log('Listing existing jobs at cron-job.org…');
  const existing = await listExistingJobs(cjToken);
  const existingTitles = new Set(existing.map((j) => j.title));

  let created = 0;
  let skipped = 0;
  let failed = 0;
  for (const spec of JOBS) {
    const fullTitle = TITLE_PREFIX + spec.title;
    if (existingTitles.has(fullTitle)) {
      console.log(`  skip (already exists): ${fullTitle}`);
      skipped++;
      continue;
    }
    try {
      const id = await createJob(cjToken, ghToken, spec);
      console.log(`  created #${id}: ${fullTitle}  (cron: ${spec.cron} UTC)`);
      created++;
    } catch (e) {
      failed++;
      console.error(`  FAIL  ${fullTitle}\n        ${(e as Error).message}`);
    }
    // cron-job.org's free tier sometimes throttles bursts of PUTs; pace
    // ourselves a bit so we don't lose subsequent creates to 429s.
    await new Promise((r) => setTimeout(r, 1500));
  }
  console.log(`Done. ${created} created, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
