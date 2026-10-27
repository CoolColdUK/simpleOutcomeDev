import tpTripDayIsPast from './tpTripDayIsPast';

export interface TpDayChipRef {
  readonly id: string;
  readonly calendarDate: string;
}

export default function tpVisibleTripDayChips(
  days: readonly TpDayChipRef[],
  showPast: boolean,
  tripTimezone: string,
  selectedDayId: string | undefined,
  nowMs: number = Date.now(),
): readonly TpDayChipRef[] {
  if (showPast) {
    return days;
  }
  const isPast = (day: TpDayChipRef): boolean => tpTripDayIsPast(day.calendarDate, tripTimezone, nowMs);
  let visible = days.filter((day) => !isPast(day));
  if (visible.length === 0 && days.length > 0) {
    const sorted = [...days].sort((a, b) => a.calendarDate.localeCompare(b.calendarDate));
    const last = sorted.at(-1);
    visible = last === undefined ? [] : [last];
  }
  const selected = selectedDayId === undefined ? undefined : days.find((day) => day.id === selectedDayId);
  if (selected !== undefined && isPast(selected) && !visible.some((day) => day.id === selected.id)) {
    const ids = new Set(visible.map((day) => day.id));
    ids.add(selected.id);
    return days.filter((day) => ids.has(day.id));
  }
  return visible;
}
