import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface TpDateTimeParts {
  readonly date: string;
  readonly time: string;
}

export function tpPartsFromInstant(iso: string | undefined, ianaZone: string): TpDateTimeParts {
  if (iso === undefined || iso === '') {
    return {date: '', time: ''};
  }
  const d = dayjs(iso).tz(ianaZone);
  if (!d.isValid()) {
    return {date: '', time: ''};
  }
  return {date: d.format('YYYY-MM-DD'), time: d.format('HH:mm')};
}

export function tpInstantFromParts(date: string, time: string, ianaZone: string): string | undefined {
  if (date === '' || time === '') {
    return undefined;
  }
  const d = dayjs.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', ianaZone);
  if (!d.isValid()) {
    return undefined;
  }
  return d.toISOString();
}
