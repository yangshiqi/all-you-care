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
