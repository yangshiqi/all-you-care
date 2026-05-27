// pipeline/src/lib/embedding.ts
//
// Gemini embedding client + cosine-similarity helpers for semantic dedup.

import type { Logger } from './log.js';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-embedding-001';
const MAX_BATCH = 100;
const RETRY_DELAYS = [5_000, 15_000, 30_000];

// ---- public API -----------------------------------------------------------

export interface EmbedResult {
  embeddings: number[][];
  model: string;
}

export async function embedTexts(
  texts: string[],
  opts: { model?: string; log: Logger },
): Promise<EmbedResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');

  const model = opts.model ?? DEFAULT_MODEL;
  const all: number[][] = [];

  for (let i = 0; i < texts.length; i += MAX_BATCH) {
    const batch = texts.slice(i, i + MAX_BATCH);
    const vecs = await batchEmbed(batch, model, key, opts.log);
    all.push(...vecs);
  }

  if (all.length !== texts.length) {
    throw new Error(`Embedding count mismatch: expected ${texts.length}, got ${all.length}`);
  }

  return { embeddings: all, model };
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// ---- internals ------------------------------------------------------------

async function batchEmbed(
  texts: string[],
  model: string,
  apiKey: string,
  log: Logger,
): Promise<number[][]> {
  const url = `${GEMINI_URL}/${model}:batchEmbedContents?key=${apiKey}`;
  const body = {
    requests: texts.map((text) => ({
      model: `models/${model}`,
      content: { parts: [{ text }] },
    })),
  };

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch((err: Error) => {
      if (attempt < RETRY_DELAYS.length) return null;
      throw err;
    });

    if (!res || res.status === 429 || (res.status >= 500 && res.status < 600)) {
      if (attempt < RETRY_DELAYS.length) {
        const delay = RETRY_DELAYS[attempt]!;
        log.warn(
          { event: 'embed_retry', status: res?.status ?? 'network', attempt, delay },
          'embedding API retryable error',
        );
        await sleep(delay);
        continue;
      }
      throw new Error(`Gemini embedding API error: ${res?.status ?? 'network'}`);
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini embedding API ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      embeddings?: { values: number[] }[];
    };
    if (!data.embeddings || !Array.isArray(data.embeddings)) {
      throw new Error('Invalid response structure from Gemini embedding API');
    }
    return data.embeddings.map((e) => e.values);
  }
  throw new Error('unreachable');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
