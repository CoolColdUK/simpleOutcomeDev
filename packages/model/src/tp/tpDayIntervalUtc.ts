export interface TpDayIntervalUtc {
  readonly startMs: number;
  readonly endMs: number;
}

export default function tpDayIntervalUtc(calendarDate: string, tripTimezone: string): TpDayIntervalUtc {
  const noonUtc = new Date(`${calendarDate}T12:00:00.000Z`).getTime();
  const offsetParts = new Intl.DateTimeFormat('en-US', {
    timeZone: tripTimezone,
    timeZoneName: 'longOffset',
  }).formatToParts(new Date(noonUtc));
  const offsetRaw = offsetParts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const match = offsetRaw.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
  let offsetMinutes = 0;
  if (match !== null) {
    const hours = Number.parseInt(match[1], 10);
    const mins = match[2] !== undefined ? Number.parseInt(match[2], 10) : 0;
    offsetMinutes = hours * 60 + (hours < 0 ? -mins : mins);
  }
  const startMs = Date.parse(`${calendarDate}T00:00:00.000Z`) - offsetMinutes * 60_000;
  const endMs = startMs + 86_400_000;
  return {startMs, endMs};
}
