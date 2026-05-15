import { spawn } from 'node:child_process';
import Anthropic from '@anthropic-ai/sdk';
import type { Logger } from './log.js';

export interface LlmCallOpts {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  expectJson?: boolean;
  log: Logger;
}

export interface LlmResult<T = unknown> {
  text: string;
  json?: T;
  inputTokens: number;
  outputTokens: number;
  stopReason: string | null;
}

export class LlmTruncatedError extends Error {}
export class LlmJsonParseError extends Error {}

export function extractJsonObject(raw: string): unknown {
  let s = raw.trim();
  // Strip ```json / ``` fence
  const fence = s.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  if (fence && fence[1] !== undefined) s = fence[1].trim();
  // Slice first { to last }
  const first = s.indexOf('{');
  const last  = s.lastIndexOf('}');
  if (first < 0 || last < 0 || last < first) {
    throw new LlmJsonParseError('no JSON object found in response');
  }
  const slice = s.slice(first, last + 1);
  try {
    return JSON.parse(slice);
  } catch (e) {
    throw new LlmJsonParseError(
      `JSON parse failed: ${(e as Error).message}; head=${slice.slice(0, 200)}; tail=${slice.slice(-200)}`,
    );
  }
}

const RETRY_DELAYS_MS = [1_000, 4_000, 16_000];

function isRetryable(e: unknown): boolean {
  const msg = (e as Error)?.message ?? '';
  if (/429|rate.?limit/i.test(msg)) return true;
  if (/5\d\d/.test(msg)) return true;
  if (/ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|fetch failed/i.test(msg)) return true;
  return false;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');
  _client = new Anthropic({ apiKey: key });
  return _client;
}

async function callViaClaudeCli(opts: {
  prompt: string;
  model: string;
  log: Logger;
  timeoutMs: number;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      'claude',
      ['-p', '--output-format', 'text', '--model', opts.model],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    );

    let stdout = '';
    let stderr = '';
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      proc.kill('SIGKILL');
    }, opts.timeoutMs);

    proc.stdout.setEncoding('utf8');
    proc.stderr.setEncoding('utf8');
    proc.stdout.on('data', (c) => {
      stdout += c;
    });
    proc.stderr.on('data', (c) => {
      stderr += c;
    });
    proc.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
    proc.on('close', (code) => {
      clearTimeout(timer);
      if (killed) return reject(new Error(`claude cli timed out after ${opts.timeoutMs}ms`));
      if (code !== 0) return reject(new Error(`claude cli exit ${code}: ${stderr.slice(0, 500)}`));
      resolve(stdout.trim());
    });

    proc.stdin.on('error', () => {
      /* ignore EPIPE */
    });
    proc.stdin.write(opts.prompt);
    proc.stdin.end();
  });
}

async function callViaCodexCli(opts: {
  prompt: string;
  model?: string;
  log: Logger;
  timeoutMs: number;
}): Promise<string> {
  const { mkdtempSync } = await import('node:fs');
  const { readFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');

  const dir = mkdtempSync(join(tmpdir(), 'codex-'));
  const outFile = join(dir, 'last.txt');
  const args = ['exec', '-', '-s', 'read-only', '-o', outFile];
  if (opts.model) args.push('-m', opts.model);

  return await new Promise<string>((resolve, reject) => {
    const proc = spawn('codex', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stderr = '';
    let killed = false;
    const timer = setTimeout(() => {
      killed = true;
      proc.kill('SIGKILL');
    }, opts.timeoutMs);
    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', (c) => {
      stderr += c;
    });
    proc.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
    proc.on('close', async (code) => {
      clearTimeout(timer);
      try {
        if (killed) {
          return reject(new Error(`codex cli timed out after ${opts.timeoutMs}ms`));
        }
        if (code !== 0) {
          return reject(new Error(`codex cli exit ${code}: ${stderr.slice(0, 500)}`));
        }
        const text = await readFile(outFile, 'utf8');
        resolve(text);
      } finally {
        await rm(dir, { recursive: true, force: true }).catch(() => {});
      }
    });
    proc.stdin.on('error', () => {
      /* ignore EPIPE */
    });
    proc.stdin.write(opts.prompt);
    proc.stdin.end();
  });
}

type Provider = 'anthropic' | 'claude_cli' | 'codex_cli';

function pickProvider(): Provider {
  const explicit = (process.env.LLM_PROVIDER ?? '').toLowerCase().trim();
  if (explicit === 'codex' || explicit === 'codex_cli') return 'codex_cli';
  if (explicit === 'claude' || explicit === 'claude_cli') return 'claude_cli';
  if (explicit === 'anthropic' || explicit === 'sdk' || explicit === 'api') return 'anthropic';
  // auto: SDK if API key set, else local codex CLI (more reliable on big batches than claude cli)
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim()) return 'anthropic';
  return 'codex_cli';
}

export async function callLlm<T = unknown>(opts: LlmCallOpts): Promise<LlmResult<T>> {
  const model = opts.model ?? 'claude-sonnet-4-6';
  const maxTokens = opts.maxTokens ?? 16000;
  const temperature = opts.temperature ?? 0;
  const log = opts.log;

  const provider = pickProvider();

  if (provider === 'codex_cli') {
    const codexModel = process.env.CODEX_MODEL?.trim() || undefined;
    log.info(
      { event: 'llm_via_codex', model: codexModel ?? '(codex default)' },
      'using local codex cli',
    );
    const t0 = Date.now();
    const text = await callViaCodexCli({
      prompt: opts.prompt,
      ...(codexModel ? { model: codexModel } : {}),
      log,
      timeoutMs: 600_000, // 10min — codex is slower; merge/render with ~25KB input often takes 4-5min
    });
    log.info(
      { event: 'llm_codex_ok', ms: Date.now() - t0, bytes: text.length },
      'codex cli ok',
    );
    const result: LlmResult<T> = {
      text,
      inputTokens: 0,
      outputTokens: 0,
      stopReason: null,
    };
    if (opts.expectJson) {
      result.json = extractJsonObject(text) as T;
    }
    return result;
  }

  if (provider === 'claude_cli') {
    log.info(
      { event: 'llm_via_cli', model },
      'using local claude cli (no ANTHROPIC_API_KEY)',
    );
    const t0 = Date.now();
    const text = await callViaClaudeCli({
      prompt: opts.prompt,
      model,
      log,
      timeoutMs: 180_000,
    });
    log.info(
      { event: 'llm_cli_ok', model, ms: Date.now() - t0, bytes: text.length },
      'llm cli ok',
    );
    const result: LlmResult<T> = {
      text,
      inputTokens: 0,
      outputTokens: 0,
      stopReason: null,
    };
    if (opts.expectJson) {
      result.json = extractJsonObject(text) as T;
    }
    return result;
  }

  let attempt = 0;
  let lastErr: unknown;
  while (attempt < RETRY_DELAYS_MS.length + 1) {
    const t0 = Date.now();
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 180_000);
      const resp = await client().messages.create(
        {
          model,
          max_tokens: maxTokens,
          temperature,
          ...(opts.systemPrompt ? { system: opts.systemPrompt } : {}),
          messages: [{ role: 'user', content: opts.prompt }],
        },
        { signal: ctrl.signal },
      );
      clearTimeout(to);

      const text = resp.content
        .filter((c): c is Extract<typeof c, { type: 'text' }> => c.type === 'text')
        .map((c) => c.text)
        .join('');
      const inputTokens = resp.usage.input_tokens ?? 0;
      const outputTokens = resp.usage.output_tokens;
      const stopReason = resp.stop_reason ?? null;

      log.info(
        {
          event: 'llm',
          model,
          ms: Date.now() - t0,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          stop_reason: stopReason,
        },
        'llm ok',
      );

      if (stopReason === 'max_tokens') {
        throw new LlmTruncatedError(`response truncated at ${maxTokens} tokens; raise maxTokens`);
      }

      const result: LlmResult<T> = { text, inputTokens, outputTokens, stopReason };
      if (opts.expectJson) {
        result.json = extractJsonObject(text) as T;
      }
      return result;
    } catch (e) {
      lastErr = e;
      if (e instanceof LlmTruncatedError || e instanceof LlmJsonParseError) throw e;
      if (!isRetryable(e) || attempt >= RETRY_DELAYS_MS.length) throw e;
      const delay = RETRY_DELAYS_MS[attempt] ?? 1_000;
      log.warn(
        { event: 'llm_retry', attempt: attempt + 1, delay, err: (e as Error).message },
        'llm retry',
      );
      await sleep(delay);
      attempt++;
    }
  }
  throw lastErr;
}
