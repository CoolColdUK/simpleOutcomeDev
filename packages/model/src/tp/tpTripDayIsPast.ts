import localDateInZone from './localDateInZone';

export default function tpTripDayIsPast(
  calendarDate: string,
  tripTimezone: string,
  nowMs: number = Date.now(),
): boolean {
  if (calendarDate === '') {
    return false;
  }
  const today = localDateInZone(new Date(nowMs).toISOString(), tripTimezone);
  if (today === '') {
    return false;
  }
  return calendarDate < today;
}
