import { describe, it, expect } from 'vitest';
import { isTransientDbError } from '../../src/lib/db.js';

describe('isTransientDbError', () => {
  it('classifies flaky-network failures as transient', () => {
    for (const msg of [
      'TypeError: fetch failed',
      'request to https://x.supabase.co failed, reason: read ECONNRESET',
      'connect ECONNREFUSED 1.2.3.4:443',
      'getaddrinfo ENOTFOUND db.supabase.co',
      'getaddrinfo EAI_AGAIN db.supabase.co',
      'socket hang up',
      'network timeout at: https://x',
      'upstream returned 503 Service Unavailable',
      'gateway 504',
    ]) {
      expect(isTransientDbError(msg), msg).toBe(true);
    }
  });

  it('does NOT retry real (non-transient) DB errors', () => {
    for (const msg of [
      'duplicate key value violates unique constraint "news_items_channel_source_dedup_key_key"',
      'permission denied for table issues',
      'new row violates row-level security policy',
      'invalid input value for enum channel_kind: "bogus"',
      'null value in column "title" violates not-null constraint',
      'syntax error at or near "select"',
      // real errors that merely contain the substring "network" must NOT retry
      'permission denied for table network_logs',
      'violates foreign key constraint on network_id',
    ]) {
      expect(isTransientDbError(msg), msg).toBe(false);
    }
  });

  it('returns false for null / undefined / empty message', () => {
    expect(isTransientDbError(null)).toBe(false);
    expect(isTransientDbError(undefined)).toBe(false);
    expect(isTransientDbError('')).toBe(false);
  });
});
