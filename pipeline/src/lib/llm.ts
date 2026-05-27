import { spawn } from 'node:child_process';
import Anthropic from '@anthropic-ai/sdk';
import type { Logger } from './log.js';
import type { ChainEntry } from '../channels/types.js';

export interface LlmCallOpts {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  expectJson?: boolean;
  chain?: ChainEntry[];
  log: Logger;
}

export interface LlmResult<T = unknown> {
  text: string;
  json?: T;
  inputTokens: number;
  outputTokens: number;
  stopReason: string | null;
  provider: string;
  model: string;
}

export class LlmTruncatedError extends Error {}
export class LlmJsonParseError extends Error {}

// ---- JSON repair helpers --------------------------------------------------

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
  const fence = s.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  if (fence && fence[1] !== undefined) s = fence[1].trim();
  const first = s.indexOf('{');
  const last  = s.lastIndexOf('}');
  if (first < 0 || last < 0 || last < first) {
    throw new LlmJsonParseError('no JSON object found in response');
  }
  const slice = s.slice(first, last + 1);
  try {
    return JSON.parse(slice);
  } catch {
    const repaired = repairJsonControlChars(slice);
    try {
      return JSON.parse(repaired);
    } catch {
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

// ---- shared ---------------------------------------------------------------

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

// ---- Anthropic provider ---------------------------------------------------

let _client: Anthropic | null = null;
function anthropicClient(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');
  const baseURL = (process.env.ANTHROPIC_BASE_URL ?? process.env.ANTHROPIC_ENDPOINT ?? '').trim();
  _client = new Anthropic({ apiKey: key, ...(baseURL ? { baseURL } : {}) });
  return _client;
}

async function callAnthropic(opts: {
  prompt: string;
  systemPrompt?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  log: Logger;
}): Promise<{ text: string; inputTokens: number; outputTokens: number; stopReason: string | null }> {
  const { model, maxTokens, temperature, log } = opts;
  let attempt = 0;
  let lastErr: unknown;
  while (attempt < RETRY_DELAYS_MS.length + 1) {
    const t0 = Date.now();
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 600_000);
      let resp;
      try {
        resp = await anthropicClient().messages.create(
          {
            model,
            max_tokens: maxTokens,
            temperature,
            ...(opts.systemPrompt ? { system: opts.systemPrompt } : {}),
            messages: [{ role: 'user', content: opts.prompt }],
          },
          { signal: ctrl.signal },
        );
      } finally {
        clearTimeout(to);
      }

      let body: unknown = resp;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { /* falls through */ }
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
        { event: 'llm', provider: 'anthropic', model, ms: Date.now() - t0, input_tokens: inputTokens, output_tokens: outputTokens, stop_reason: stopReason },
        'llm ok',
      );

      if (stopReason === 'max_tokens') {
        throw new LlmTruncatedError(`response truncated at ${maxTokens} tokens; raise maxTokens`);
      }
      return { text, inputTokens, outputTokens, stopReason };
    } catch (e) {
      lastErr = e;
      if (e instanceof LlmTruncatedError) throw e;
      if (!isRetryable(e) || attempt >= RETRY_DELAYS_MS.length) throw e;
      const delay = RETRY_DELAYS_MS[attempt] ?? 1_000;
      log.warn({ event: 'llm_retry', provider: 'anthropic', attempt: attempt + 1, delay, err: (e as Error).message }, 'llm retry');
      await sleep(delay);
      attempt++;
    }
  }
  throw lastErr;
}

// ---- Gemini provider ------------------------------------------------------

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_RETRY_DELAYS = [5_000, 15_000, 30_000];

async function callGemini(opts: {
  prompt: string;
  systemPrompt?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  expectJson?: boolean;
  log: Logger;
}): Promise<{ text: string; inputTokens: number; outputTokens: number; stopReason: string | null }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');

  const { model, maxTokens, temperature, log } = opts;
  const url = `${GEMINI_URL}/${model}:generateContent?key=${key}`;
  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: opts.prompt }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
      ...(opts.expectJson ? { responseMimeType: 'application/json' } : {}),
    },
  };
  if (opts.systemPrompt) {
    body.systemInstruction = { parts: [{ text: opts.systemPrompt }] };
  }

  for (let attempt = 0; attempt <= GEMINI_RETRY_DELAYS.length; attempt++) {
    const t0 = Date.now();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(600_000),
    }).catch((err: Error) => {
      if (attempt < GEMINI_RETRY_DELAYS.length) return null;
      throw err;
    });

    if (!res || res.status === 429 || (res.status >= 500 && res.status < 600)) {
      if (attempt < GEMINI_RETRY_DELAYS.length) {
        const delay = GEMINI_RETRY_DELAYS[attempt]!;
        log.warn({ event: 'llm_retry', provider: 'gemini', model, status: res?.status ?? 'network', attempt, delay }, 'gemini retry');
        await sleep(delay);
        continue;
      }
      throw new Error(`Gemini API error: ${res?.status ?? 'network'}`);
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json() as {
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
    };

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p?.text ?? '').join('') ?? '';
    const inputTokens = data?.usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = (data?.usageMetadata?.candidatesTokenCount ?? 0) + (data?.usageMetadata?.thoughtsTokenCount ?? 0);
    const stopReason = data?.candidates?.[0]?.finishReason ?? null;

    log.info(
      { event: 'llm', provider: 'gemini', model, ms: Date.now() - t0, input_tokens: inputTokens, output_tokens: outputTokens, stop_reason: stopReason },
      'llm ok',
    );

    if (stopReason === 'MAX_TOKENS') {
      throw new LlmTruncatedError(`response truncated at ${maxTokens} tokens; raise maxTokens`);
    }
    return { text, inputTokens, outputTokens, stopReason };
  }
  throw new Error('unreachable');
}

// ---- codex CLI fallback ---------------------------------------------------

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
    const timer = setTimeout(() => { killed = true; proc.kill('SIGKILL'); }, opts.timeoutMs);
    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', (c) => { stderr += c; });
    proc.on('error', (e) => { clearTimeout(timer); reject(e); });
    proc.on('close', async (code) => {
      clearTimeout(timer);
      try {
        if (killed) return reject(new Error(`codex cli timed out after ${opts.timeoutMs}ms`));
        if (code !== 0) return reject(new Error(`codex cli exit ${code}: ${stderr.slice(0, 500)}`));
        const text = await readFile(outFile, 'utf8');
        resolve(text);
      } finally {
        await rm(dir, { recursive: true, force: true }).catch(() => {});
      }
    });
    proc.stdin.on('error', () => { /* ignore EPIPE */ });
    proc.stdin.write(opts.prompt);
    proc.stdin.end();
  });
}

// ---- single-provider dispatch ---------------------------------------------

async function callSingleProvider(
  provider: string,
  model: string,
  opts: LlmCallOpts & { maxTokens: number; temperature: number },
): Promise<LlmResult<unknown>> {
  if (provider === 'gemini') {
    const raw = await callGemini({
      prompt: opts.prompt,
      systemPrompt: opts.systemPrompt,
      model,
      maxTokens: opts.maxTokens,
      temperature: opts.temperature,
      expectJson: opts.expectJson,
      log: opts.log,
    });
    const result: LlmResult = { ...raw, provider: 'gemini', model };
    if (opts.expectJson) result.json = extractJsonObject(raw.text);
    return result;
  }

  if (provider === 'codex_cli') {
    const codexModel = process.env.CODEX_MODEL?.trim() || undefined;
    opts.log.info({ event: 'llm_via_codex', model: codexModel ?? '(codex default)' }, 'using local codex cli');
    const t0 = Date.now();
    const text = await callViaCodexCli({
      prompt: opts.prompt,
      ...(codexModel ? { model: codexModel } : {}),
      log: opts.log,
      timeoutMs: 600_000,
    });
    opts.log.info({ event: 'llm_codex_ok', ms: Date.now() - t0, bytes: text.length }, 'codex cli ok');
    const result: LlmResult = { text, inputTokens: 0, outputTokens: 0, stopReason: null, provider: 'codex_cli', model: codexModel ?? 'codex' };
    if (opts.expectJson) result.json = extractJsonObject(text);
    return result;
  }

  // anthropic (default)
  const raw = await callAnthropic({
    prompt: opts.prompt,
    systemPrompt: opts.systemPrompt,
    model,
    maxTokens: opts.maxTokens,
    temperature: opts.temperature,
    log: opts.log,
  });
  const result: LlmResult = { ...raw, provider: 'anthropic', model };
  if (opts.expectJson) result.json = extractJsonObject(raw.text);
  return result;
}

// ---- public entry point ---------------------------------------------------

type Provider = 'anthropic' | 'gemini' | 'codex_cli';

function pickProvider(): Provider {
  const explicit = (process.env.LLM_PROVIDER ?? '').toLowerCase().trim();
  if (explicit === 'codex' || explicit === 'codex_cli') return 'codex_cli';
  if (explicit === 'anthropic' || explicit === 'sdk' || explicit === 'api') return 'anthropic';
  if (explicit === 'gemini') return 'gemini';
  if (process.env.ANTHROPIC_API_KEY?.trim()) return 'anthropic';
  return 'codex_cli';
}

export async function callLlm<T = unknown>(opts: LlmCallOpts): Promise<LlmResult<T>> {
  const model = opts.model ?? 'claude-sonnet-4-6';
  const maxTokens = opts.maxTokens ?? 16000;
  const temperature = opts.temperature ?? 0;

  const fullOpts = { ...opts, maxTokens, temperature };

  // Bypass chain if codex_cli is explicitly forced (offline dev).
  const forceProvider = pickProvider();

  // Chain mode: try each provider in order, fall back on failure.
  if (opts.chain && opts.chain.length > 0 && forceProvider !== 'codex_cli') {
    let lastErr: unknown;
    for (let i = 0; i < opts.chain.length; i++) {
      const entry = opts.chain[i]!;
      // Skip if required API key is missing.
      if (entry.provider === 'gemini' && !process.env.GEMINI_API_KEY?.trim()) {
        opts.log.info({ event: 'chain_skip', provider: 'gemini', reason: 'no GEMINI_API_KEY' }, 'skipping gemini in chain');
        continue;
      }
      if (entry.provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY?.trim()) {
        opts.log.info({ event: 'chain_skip', provider: 'anthropic', reason: 'no ANTHROPIC_API_KEY' }, 'skipping anthropic in chain');
        continue;
      }
      try {
        return await callSingleProvider(entry.provider, entry.model, fullOpts) as LlmResult<T>;
      } catch (e) {
        lastErr = e;
        if (e instanceof LlmTruncatedError) throw e;
        const isLast = i === opts.chain.length - 1;
        opts.log.warn(
          { event: 'chain_fallback', from: `${entry.provider}/${entry.model}`, attempt: i + 1, total: opts.chain.length, err: (e as Error).message, is_last: isLast },
          isLast ? 'chain exhausted' : 'falling back to next provider',
        );
        if (isLast) throw e;
      }
    }
    throw lastErr ?? new Error('chain is empty after skipping providers with missing keys');
  }

  // Legacy single-provider mode (or codex_cli forced).
  return await callSingleProvider(forceProvider, model, fullOpts) as LlmResult<T>;
}
