import localDateInZone from './localDateInZone';

export interface TpDayForDefaultSelect {
  readonly id: string;
  readonly calendarDate: string;
}

function dayUtcMs(ymd: string): number | undefined {
  const parts = ymd.split('-');
  if (parts.length !== 3) {
    return undefined;
  }
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) {
    return undefined;
  }
  return Date.UTC(y, m - 1, d);
}

export default function tpDefaultSelectedDayId(
  days: readonly TpDayForDefaultSelect[],
  tripTimezone: string,
  nowMs: number = Date.now(),
): string | undefined {
  if (days.length === 0) {
    return undefined;
  }
  const sorted = [...days].sort((a, b) => a.calendarDate.localeCompare(b.calendarDate));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const today = localDateInZone(new Date(nowMs).toISOString(), tripTimezone);
  if (today === '') {
    return first.id;
  }
  if (today < first.calendarDate) {
    return first.id;
  }
  if (today > last.calendarDate) {
    return last.id;
  }
  const exact = sorted.find((d) => d.calendarDate === today);
  if (exact !== undefined) {
    return exact.id;
  }
  const todayMs = dayUtcMs(today);
  if (todayMs === undefined) {
    return first.id;
  }
  let best = first;
  let bestDist = Infinity;
  for (const day of sorted) {
    const dayMs = dayUtcMs(day.calendarDate);
    if (dayMs === undefined) {
      continue;
    }
    const dist = Math.abs(todayMs - dayMs);
    if (dist < bestDist || (dist === bestDist && day.calendarDate < best.calendarDate)) {
      bestDist = dist;
      best = day;
    }
  }
  return best.id;
}
