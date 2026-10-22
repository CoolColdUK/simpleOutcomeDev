import tpDayIntervalUtc from './tpDayIntervalUtc';

export default function tpSpanOverlapsTripDay(
  spanStartIso: string,
  spanEndIso: string,
  calendarDate: string,
  tripTimezone: string,
): boolean {
  const spanStart = Date.parse(spanStartIso);
  const spanEnd = Date.parse(spanEndIso);
  if (Number.isNaN(spanStart) || Number.isNaN(spanEnd)) {
    return false;
  }
  const {startMs, endMs} = tpDayIntervalUtc(calendarDate, tripTimezone);
  return spanStart <= endMs && spanEnd >= startMs;
}
