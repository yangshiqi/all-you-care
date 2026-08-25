// pipeline/src/lib/usage.ts
//
// LLM / embedding cost tracking. Inserts a row into `llm_usage` after each
// API call so we can answer "how much did today's issue cost?"

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Logger } from './log.js';

export interface UsageRecord {
  channel: string;
  step: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  duration_ms?: number;
}

// Per-million-token pricing. Add new models here as needed.
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5': { input: 0.80, output: 4.00 },
  'claude-sonnet-4-6':        { input: 3.00, output: 15.00 },
  'claude-sonnet-4-7':        { input: 3.00, output: 15.00 },
  'claude-sonnet-4-5-20250514': { input: 3.00, output: 15.00 },
  'claude-opus-4-7':          { input: 15.00, output: 75.00 },
  'gemini-embedding-001':     { input: 0.00, output: 0.00 },
  'gemini-3.5-flash':         { input: 1.50, output: 9.00 },
  // Intro pricing through 2026-12-31; becomes $1.50/$7.50 from 2027-01.
  'gemini-3.7-flash':         { input: 0.75, output: 3.75 },
  'gemini-2.5-flash':         { input: 0.00, output: 0.00 },
  'gemini-3-flash-preview':   { input: 0.00, output: 0.00 },
};

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = PRICING[model];
  if (!rates) return 0;
  return (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000;
}

export async function trackUsage(
  db: SupabaseClient,
  record: UsageRecord,
  log: Logger,
): Promise<void> {
  try {
    const cost = estimateCost(record.model, record.input_tokens, record.output_tokens);
    if (cost === 0 && (record.input_tokens > 0 || record.output_tokens > 0)) {
      log.warn({ event: 'usage_unknown_model', model: record.model }, 'model not in pricing table, cost recorded as $0');
    }
    const { error } = await db.from('llm_usage').insert({
      ...record,
      cost_usd: cost,
    });
    if (error) {
      log.warn({ event: 'usage_insert_fail', err: error.message }, 'failed to track LLM usage');
    }
  } catch (err) {
    log.warn({ event: 'usage_insert_fail', err: (err as Error).message }, 'failed to track LLM usage');
  }
}
