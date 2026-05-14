// pipeline/src/cli.ts
// Usage: tsx src/cli.ts <channel> <step> [--dry-run] [--limit N] [--verbose]
import { createLogger } from './lib/log.js';
import { createDb } from './lib/db.js';
import { loadChannel, channelDir } from './channels/load.js';
import type { ChannelConfig } from './channels/types.js';

interface ParsedArgs {
  channel: 'ai' | 'snow';
  step: string;
  dryRun: boolean;
  limit?: number;
  verbose: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: pipeline <channel> <step> [--dry-run] [--limit N] [--verbose]');
    process.exit(2);
  }
  const channel = args[0] as 'ai' | 'snow';
  if (channel !== 'ai' && channel !== 'snow') {
    console.error(`unknown channel: ${channel}`);
    process.exit(2);
  }
  const step = args[1]!;
  const rest = args.slice(2);
  const dryRun = rest.includes('--dry-run');
  const verbose = rest.includes('--verbose');
  let limit: number | undefined;
  const li = rest.indexOf('--limit');
  if (li >= 0 && rest[li + 1]) limit = Number(rest[li + 1]);
  return { channel, step, dryRun, ...(limit !== undefined ? { limit } : {}), verbose };
}

export interface StepContext {
  channel: ChannelConfig;
  channelDir: string;
  db: ReturnType<typeof createDb>;
  log: ReturnType<typeof createLogger>;
  now: Date;
  dryRun: boolean;
  limit?: number;
}

export interface StepResult {
  processed: number;
  skipped: number;
  failed: number;
  notes?: string;
}

type StepModule = { run: (ctx: StepContext) => Promise<StepResult> };

// Step files are added incrementally across phases. The dynamic import path is
// constructed at call time so TS doesn't statically resolve missing modules
// (resolution failure is reported at runtime when the step is invoked).
const STEP_NAMES = [
  'fetch', 'fetchRss', 'fetchEmail', 'compress', 'score', 'merge',
  'render', 'publish', 'reutersImage', 'tags', 'deliver',
] as const;
type StepName = (typeof STEP_NAMES)[number];

function loadStep(name: string): Promise<StepModule> {
  const path = `./steps/${name}.js`;
  return import(/* @vite-ignore */ path) as Promise<StepModule>;
}

function isKnownStep(name: string): name is StepName {
  return (STEP_NAMES as readonly string[]).includes(name);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.verbose) process.env.LOG_VERBOSE = '1';

  const log = createLogger({ channel: args.channel, step: args.step });
  log.info({ event: 'start', dry_run: args.dryRun, limit: args.limit }, 'step start');
  const t0 = Date.now();

  try {
    const channel = await loadChannel(args.channel);
    const cd = channelDir(args.channel);
    const db = createDb();
    if (!isKnownStep(args.step)) throw new Error(`unknown step: ${args.step}`);
    const mod = await loadStep(args.step);
    const result = await mod.run({
      channel,
      channelDir: cd,
      db,
      log,
      now: new Date(),
      dryRun: args.dryRun,
      ...(args.limit !== undefined ? { limit: args.limit } : {}),
    });
    log.info({
      event: 'end', ms: Date.now() - t0,
      processed: result.processed, skipped: result.skipped, failed: result.failed,
      notes: result.notes,
    }, 'step end');
    if (result.failed > 0 && result.processed === 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (e) {
    const err = e as Error;
    log.error({ event: 'crash', err: err.message, stack: err.stack?.split('\n').slice(0, 5).join('|') }, 'step crashed');
    process.exit(1);
  }
}

main();
