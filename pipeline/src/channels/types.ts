import { z } from 'zod';

export const RssSourceSchema = z.object({
  url: z.string().url(),
  enabled: z.boolean().default(true),
});

const ChainEntrySchema = z.object({
  provider: z.enum(['gemini', 'anthropic']),
  model: z.string(),
});

export type ChainEntry = z.infer<typeof ChainEntrySchema>;

export const ChannelConfigSchema = z.object({
  name: z.enum(['ai', 'snow']),
  display_name: z.string(),
  sources: z.object({
    rss: z.array(RssSourceSchema).default([]),
    opml: z.array(RssSourceSchema).default([]),
    email: z.array(z.string()).default([]),
  }),
  windows: z.object({
    fetch_rss_age_hours: z.number().int().positive(),
    fetch_email_age_hours: z.number().int().positive(),
    compress_lookback_hours: z.number().int().positive(),
    merge_new_lookback_hours: z.number().int().positive(),
    merge_old_lookback_hours: z.number().int().positive(),
  }),
  thresholds: z.object({
    compress_min_pending: z.number().int().nonnegative(),
    compress_batch_size:  z.number().int().positive(),
    score_batch_size:     z.number().int().positive(),
  }),
  cover_image: z.object({
    prefer: z.enum(['reuters_pool', 'cdn_convention']),
    cdn_pattern: z.string(),
    cdn_random_max: z.number().int().positive(),
    default: z.string(),
  }),
  embedding: z.object({
    model: z.string().default('gemini-embedding-001'),
    similarity_threshold: z.number().min(0).max(1).default(0.79),
  }).optional(),
  deliver: z.object({ url: z.string().url() }),
  llm: z.object({
    model: z.string(),
    max_tokens: z.number().int().positive(),
    temperature: z.number().min(0).max(2),
    steps: z.record(
      z.enum(['compress', 'score', 'merge', 'render', 'reutersImage']),
      z.object({
        model: z.string().optional(),
        max_tokens: z.number().int().positive().optional(),
        temperature: z.number().min(0).max(2).optional(),
        chain: z.array(ChainEntrySchema).optional(),
      }),
    ).optional(),
  }),
});

export type ChannelConfig = z.infer<typeof ChannelConfigSchema>;

export type LlmStep = 'compress' | 'score' | 'merge' | 'render' | 'reutersImage';

export interface ResolvedLlm {
  model: string;
  maxTokens: number;
  temperature: number;
  chain?: ChainEntry[];
}

export function resolveLlm(channel: ChannelConfig, step: LlmStep): ResolvedLlm {
  const base = channel.llm;
  const override = base.steps?.[step] ?? {};
  return {
    model: override.model ?? base.model,
    maxTokens: override.max_tokens ?? base.max_tokens,
    temperature: override.temperature ?? base.temperature,
    chain: override.chain,
  };
}
