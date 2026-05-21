import { describe, it, expect } from 'vitest';
import { todayCst } from '../../src/lib/time.js';

describe('todayCst', () => {
  // Anchors verified manually:
  //   2026-01-01 is Thursday → 周四
  //   2026-05-21 is Thursday → 周四
  //   2026-12-31 is Thursday → 周四 (365 days from a Thursday lands on Thursday)
  it('returns the correct CST calendar date for a UTC noon', () => {
    expect(todayCst(new Date('2026-05-21T04:00:00Z')).date).toBe('2026-05-21');
  });

  it('rolls into the next CST day at 16:00 UTC (= 00:00 CST next day)', () => {
    // 2026-05-20 23:59:59 UTC → still 2026-05-21 CST
    expect(todayCst(new Date('2026-05-20T23:59:59Z')).date).toBe('2026-05-21');
    // 2026-05-20 15:59:00 UTC → still 2026-05-20 CST (23:59 CST)
    expect(todayCst(new Date('2026-05-20T15:59:00Z')).date).toBe('2026-05-20');
  });

  it('returns the weekday of the CST calendar date, not the underlying UTC moment', () => {
    expect(todayCst(new Date('2026-01-01T12:00:00+08:00')).weekday).toBe('周四');
    expect(todayCst(new Date('2026-05-21T12:00:00+08:00')).weekday).toBe('周四');
    expect(todayCst(new Date('2026-12-31T23:30:00+08:00')).weekday).toBe('周四');
  });

  it('returns isoStart at CST midnight, suitable for published_at filtering', () => {
    expect(todayCst(new Date('2026-05-21T04:00:00Z')).isoStart).toBe('2026-05-21T00:00:00+08:00');
  });
});
