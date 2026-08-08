import { describe, it, expect, vi, beforeEach } from 'vitest';

const fetchFeed = vi.fn();
vi.mock('../../src/lib/rss.js', () => ({ fetchFeed: (...a: unknown[]) => fetchFeed(...a) }));

const { run } = await import('../../src/steps/fetchRss.js');

const log = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };

const channel = {
  name: 'ai',
  sources: { rss: [{ url: 'https://a.test/feed', enabled: true }], opml: [], rss_deny: [], email: [] },
  windows: { fetch_rss_age_hours: 24 },
} as never;

/** Minimal supabase chain: db.from().insert().select().single() */
function dbReturning(result: () => Promise<unknown>) {
  return {
    from: () => ({ insert: () => ({ select: () => ({ single: result }) }) }),
  } as never;
}

const item = {
  title: 'a title', content: 'body', link: 'https://a.test/1',
  pub_date: new Date().toISOString(), guid: 'g1', source: 'a.test',
};

const ctx = (db: never) =>
  ({ channel, channelDir: '.', db, log, now: new Date(), dryRun: false }) as never;

beforeEach(() => { fetchFeed.mockReset(); log.warn.mockReset(); });

describe('fetchRss failure attribution', () => {
  it('books an unreachable feed as a feed failure, not an insert failure', async () => {
    fetchFeed.mockRejectedValue(new Error('Status code 403'));
    const r = await run(ctx(dbReturning(() => Promise.resolve({ error: null, data: { id: 1 } }))));
    // 1 of 1 feed down clears the outage ratio, so it does surface — but as a
    // feed failure, and notes must say so.
    expect(r.notes).toContain('feeds_failed=1');
    expect(r.processed).toBe(0);
  });

  it('books a throwing item write as an insert failure', async () => {
    // The contract this PR introduces: feedsFailed means the feed was
    // unreachable. Once fetchFeed succeeds, anything that goes wrong per item
    // is ours, and must not be laundered into the feed-failure bucket where the
    // <50% ratio silently swallows it.
    fetchFeed.mockResolvedValue([item]);
    const r = await run(ctx(dbReturning(() => Promise.reject(new Error('connection terminated')))));
    expect(r.failed).toBe(1);
    expect(r.notes).toContain('feeds_failed=0');
  });

  it('keeps processing later items after one throws', async () => {
    fetchFeed.mockResolvedValue([item, { ...item, guid: 'g2' }, { ...item, guid: 'g3' }]);
    let n = 0;
    const db = dbReturning(() => {
      n++;
      return n === 1 ? Promise.reject(new Error('boom')) : Promise.resolve({ error: null, data: { id: n } });
    });
    const r = await run(ctx(db));
    expect(n).toBe(3);          // all three attempted
    expect(r.processed).toBe(2);
    expect(r.failed).toBe(1);
  });
});
