const TZ = 'Asia/Shanghai';

export function nowMs(): number {
  return Date.now();
}

export function ageHours(d: Date | string | null | undefined, ref: Date = new Date()): number {
  if (!d) return Infinity;
  const t = typeof d === 'string' ? Date.parse(d) : d.getTime();
  if (Number.isNaN(t)) return Infinity;
  return (ref.getTime() - t) / 36e5;
}

export function shanghaiYearMonth(d: Date = new Date()): string {
  // 'YYYYMM' in Asia/Shanghai
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit',
  });
  const parts = fmt.formatToParts(d);
  const y = parts.find(p => p.type === 'year')!.value;
  const m = parts.find(p => p.type === 'month')!.value;
  return `${y}${m}`;
}

const ZH_WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const;

/**
 * Returns today's date string + Chinese weekday in Asia/Shanghai.
 * Used to deterministically build the daily issue title — historically the LLM
 * computed this and occasionally hallucinated the wrong date.
 */
export function todayCst(d: Date = new Date()): { date: string; weekday: string; isoStart: string } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const parts = fmt.formatToParts(d);
  const y = parts.find(p => p.type === 'year')!.value;
  const m = parts.find(p => p.type === 'month')!.value;
  const day = parts.find(p => p.type === 'day')!.value;
  const date = `${y}-${m}-${day}`;
  // Compute weekday FOR that calendar date (independent of timezone).
  // Parsing as UTC midnight is safe: the calendar date is the same in any zone
  // that observes the date, and getUTCDay() reads the weekday of the UTC date.
  // (Earlier bug: parsing as +08:00 gave UTC 16:00 of the previous day, which
  // shifted weekday by -1 — May 21 → Wed instead of Thu.)
  const dayIdx = new Date(`${date}T00:00:00Z`).getUTCDay();
  const weekday = ZH_WEEKDAYS[dayIdx]!;
  const isoStart = `${date}T00:00:00+08:00`;
  return { date, weekday, isoStart };
}
