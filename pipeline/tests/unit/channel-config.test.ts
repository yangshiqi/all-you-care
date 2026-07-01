import { describe, it, expect } from 'vitest';
import { parseChannelConfig } from '../../src/channels/load.js';

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
  it('accepts valid config', () => {
    expect(() => parseChannelConfig(valid)).not.toThrow();
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
