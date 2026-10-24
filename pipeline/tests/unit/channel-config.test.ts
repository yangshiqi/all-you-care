import { describe, it, expect } from 'vitest';
import { loadChannel, parseChannelConfig } from '../../src/channels/load.js';

const valid = {
  name: 'ai',
  display_name: 'AI Daily',
  sources: { rss: [{ url: 'https://x.com/feed', enabled: true }], email: ['a@b.com'] },
  windows: {
    fetch_rss_age_hours: 4, fetch_email_age_hours: 48,
    compress_lookback_hours: 12,
    merge_new_lookback_hours: 72, merge_old_lookback_hours: 72,
  },
  thresholds: { compress_min_pending: 5, compress_batch_size: 100, score_batch_size: 10 },
  cover_image: {
    prefer: 'reuters_pool',
    cdn_pattern: 'https://x.com/{yyyymm}/{n}.jpg',
    cdn_random_max: 8,
    default: '/x.jpg',
  },
  deliver: { url: 'https://x.com/api' },
  llm: { model: 'claude-sonnet-4-6', max_tokens: 16000, temperature: 0 },
};

describe('parseChannelConfig', () => {
  it.each(['ai', 'snow', 'infra'] as const)('loads the real %s channel YAML', async (name) => {
    const config = await loadChannel(name);
    expect(config.name).toBe(name);
    expect(config.llm.model).toBeTruthy();
    expect(config.deliver.url).toMatch(/^https?:\/\//);
  });
  it('accepts valid config', () => {
    expect(() => parseChannelConfig(valid)).not.toThrow();
  });
  it('accepts partial LLM step overrides without requiring every step', () => {
    const config = parseChannelConfig({
      ...valid,
      llm: { ...valid.llm, steps: { compress: { model: 'gemini-2.5-flash' } } },
    });
    expect(config.llm.steps?.compress?.model).toBe('gemini-2.5-flash');
    expect(config.llm.steps?.score).toBeUndefined();
  });
  it('accepts an empty LLM step override map', () => {
    expect(parseChannelConfig({ ...valid, llm: { ...valid.llm, steps: {} } }).llm.steps)
      .toEqual({});
  });
  it('rejects unknown LLM step override names', () => {
    expect(() => parseChannelConfig({
      ...valid,
      llm: { ...valid.llm, steps: { unknown: { model: 'gemini-2.5-flash' } } },
    })).toThrow();
  });
  it('rejects bad name', () => {
    expect(() => parseChannelConfig({ ...valid, name: 'banana' }))
      .toThrow();
  });
  it('rejects missing windows.merge_new_lookback_hours', () => {
    const bad = JSON.parse(JSON.stringify(valid));
    delete bad.windows.merge_new_lookback_hours;
    expect(() => parseChannelConfig(bad)).toThrow();
  });
  it('accepts name "infra"', () => {
    expect(() => parseChannelConfig({ ...valid, name: 'infra' })).not.toThrow();
  });
});
