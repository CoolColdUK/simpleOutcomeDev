import localDateInZone from './localDateInZone';
import type {TpDayChipRef} from './tpVisibleTripDayChips';
import tpTripDayIsPast from './tpTripDayIsPast';

export default function tpSnapDayWhenHidingPast(
  days: readonly TpDayChipRef[],
  tripTimezone: string,
  selectedDayId: string | undefined,
  nowMs: number = Date.now(),
): string | undefined {
  if (selectedDayId === undefined) {
    return undefined;
  }
  const selected = days.find((day) => day.id === selectedDayId);
  if (selected === undefined) {
    return selectedDayId;
  }
  if (!tpTripDayIsPast(selected.calendarDate, tripTimezone, nowMs)) {
    return selectedDayId;
  }
  const today = localDateInZone(new Date(nowMs).toISOString(), tripTimezone);
  if (today !== '') {
    const todayDay = days.find((day) => day.calendarDate === today);
    if (todayDay !== undefined) {
      return todayDay.id;
    }
  }
  const sorted = [...days].sort((a, b) => a.calendarDate.localeCompare(b.calendarDate));
  const firstFuture = sorted.find((day) => !tpTripDayIsPast(day.calendarDate, tripTimezone, nowMs));
  if (firstFuture !== undefined) {
    return firstFuture.id;
  }
  return sorted.at(-1)?.id;
}
