import { spawn } from 'node:child_process';
import Anthropic from '@anthropic-ai/sdk';
import type { Logger } from './log.js';
// `claude` CLI fallback was removed in favor of SDK + codex CLI. If you need to
// resurrect it, see git history pre-2026-05-21.

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

// LLMs occasionally emit literal control characters (newlines, tabs) inside
// JSON string values, which is invalid per RFC 8259. This mini-lexer walks the
// raw text, tracks whether we're inside a quoted string, and escapes any
// control char (U+0000–U+001F) found there. Structural whitespace between
// tokens is left untouched.
function repairJsonControlChars(raw: string): string {
  const out: string[] = [];
  let inString = false;
  let escaped = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]!;
    if (escaped) { out.push(ch); escaped = false; continue; }
    if (ch === '\\' && inString) { out.push(ch); escaped = true; continue; }
    if (ch === '"') { inString = !inString; out.push(ch); continue; }
    if (inString && ch.charCodeAt(0) < 0x20) {
      switch (ch) {
        case '\n': out.push('\\n'); break;
        case '\r': out.push('\\r'); break;
        case '\t': out.push('\\t'); break;
        default: out.push(`\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`); break;
      }
      continue;
    }
    out.push(ch);
  }
  return out.join('');
}

// When the LLM puts unescaped `"` inside a JSON string value (e.g.
// `"announced "record" revenue"`), naive JSON.parse fails. This function
// re-scans the (already control-char-repaired) text and escapes any `"`
// that appears inside a string literal but is NOT at a valid structural
// boundary (key-value separator, array/object delimiter). It is
// intentionally conservative: only touches `"` that follows non-whitespace
// AND is followed by a non-structural character.
function repairUnescapedQuotes(raw: string): string {
  const out: string[] = [];
  let inString = false;
  let escaped = false;
  let i = 0;
  while (i < raw.length) {
    const ch = raw[i]!;
    if (escaped) { out.push(ch); escaped = false; i++; continue; }
    if (ch === '\\' && inString) { out.push(ch); escaped = true; i++; continue; }
    if (ch === '"') {
      if (!inString) {
        inString = true;
        out.push(ch);
      } else {
        // Peek: is this quote at a valid string-end position?
        // After the closing `"`, the next non-whitespace must be `:`, `,`, `}`, `]`, or EOF.
        let j = i + 1;
        while (j < raw.length && (raw[j] === ' ' || raw[j] === '\t' || raw[j] === '\n' || raw[j] === '\r')) j++;
        const next = j < raw.length ? raw[j] : '';
        if (next === '' || next === ':' || next === ',' || next === '}' || next === ']') {
          inString = false;
          out.push(ch);
        } else {
          out.push('\\', '"');
        }
      }
      i++;
      continue;
    }
    out.push(ch);
    i++;
  }
  return out.join('');
}

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
  } catch (e1) {
    // Repair pass 1: escape control chars the LLM left unescaped inside
    // string literals (literal newline/tab mid-value).
    const repaired = repairJsonControlChars(slice);
    try {
      return JSON.parse(repaired);
    } catch {
      // Repair pass 2: the LLM sometimes emits unescaped ASCII double-quotes
      // inside string values (e.g. "announced "record" revenue"). Walk the
      // string char-by-char: a `"` that doesn't sit at a valid JSON boundary
      // (after `:`, `,`, `{`, `[` or before `:`, `,`, `}`, `]`) is interior
      // to a value → escape it.
      const repaired2 = repairUnescapedQuotes(repaired);
      try {
        return JSON.parse(repaired2);
      } catch (e3) {
        throw new LlmJsonParseError(
          `JSON parse failed: ${(e3 as Error).message}; head=${slice.slice(0, 200)}; tail=${slice.slice(-200)}`,
        );
      }
    }
  }
}

const RETRY_DELAYS_MS = [1_000, 4_000, 16_000];

function isRetryable(e: unknown): boolean {
  const msg = (e as Error)?.message ?? '';
  if (/429|rate.?limit/i.test(msg)) return true;
  if (/5\d\d/.test(msg)) return true;
  if (/ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|fetch failed/i.test(msg)) return true;
  if (/aborted|abort error|timed out|timeout/i.test(msg)) return true;
  if (/malformed llm response/i.test(msg)) return true;
  return false;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');
  // Optional override for self-hosted / proxied Anthropic-compatible endpoints.
  // Accept ANTHROPIC_BASE_URL (preferred) or fall back to ANTHROPIC_ENDPOINT.
  const baseURL = (process.env.ANTHROPIC_BASE_URL ?? process.env.ANTHROPIC_ENDPOINT ?? '').trim();
  _client = new Anthropic({ apiKey: key, ...(baseURL ? { baseURL } : {}) });
  return _client;
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

type Provider = 'anthropic' | 'codex_cli';

function pickProvider(): Provider {
  const explicit = (process.env.LLM_PROVIDER ?? '').toLowerCase().trim();
  if (explicit === 'codex' || explicit === 'codex_cli') return 'codex_cli';
  if (explicit === 'anthropic' || explicit === 'sdk' || explicit === 'api') return 'anthropic';
  // auto: SDK if API key set, else local codex CLI (offline fallback for dev)
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

  let attempt = 0;
  let lastErr: unknown;
  while (attempt < RETRY_DELAYS_MS.length + 1) {
    const t0 = Date.now();
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 600_000);
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

      // Bedrock proxy occasionally returns the body as a JSON-encoded string
      // instead of an object. Unwrap before validating shape.
      let body: unknown = resp;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { /* falls through to guard */ }
      }
      if (!Array.isArray((body as { content?: unknown })?.content)) {
        const preview = JSON.stringify(body).slice(0, 300);
        throw new Error(`malformed llm response: content missing or not array; resp=${preview}`);
      }
      const typedBody = body as typeof resp;
      const text = typedBody.content
        .filter((c): c is Extract<typeof c, { type: 'text' }> => c.type === 'text')
        .map((c) => c.text)
        .join('');
      const inputTokens = typedBody.usage?.input_tokens ?? 0;
      const outputTokens = typedBody.usage?.output_tokens ?? 0;
      const stopReason = typedBody.stop_reason ?? null;

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
      if (e instanceof LlmTruncatedError) throw e;
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
