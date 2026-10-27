import localDateInZone from './localDateInZone';

export type TpTimelinePin = 'top' | 'bottom' | 'flow';

export interface TpStayTimelinePinInput {
  readonly calendarDate: string;
  readonly checkInAt: string;
  readonly checkOutAt: string;
  readonly checkInTimezone?: string;
  readonly checkOutTimezone?: string;
  readonly tripTimezone: string;
}

export default function tpStayTimelinePinsForDay(input: TpStayTimelinePinInput): readonly TpTimelinePin[] {
  const checkInTz = input.checkInTimezone ?? input.tripTimezone;
  const checkOutTz = input.checkOutTimezone ?? input.tripTimezone;
  const dayA = localDateInZone(input.checkInAt, checkInTz);
  const dayB = localDateInZone(input.checkOutAt, checkOutTz);
  if (dayA === '' || dayB === '') {
    return ['flow'];
  }
  if (dayB < dayA) {
    return ['flow'];
  }
  if (dayA === dayB) {
    return ['flow'];
  }
  const {calendarDate} = input;
  if (calendarDate === dayA) {
    return ['bottom'];
  }
  if (calendarDate === dayB) {
    return ['top'];
  }
  if (calendarDate > dayA && calendarDate < dayB) {
    return ['top', 'bottom'];
  }
  if (calendarDate < dayA) {
    return ['bottom'];
  }
  if (calendarDate > dayB) {
    return ['top'];
  }
  return [];
}
