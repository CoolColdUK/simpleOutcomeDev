export default function syncTpCalendarDates(startDate: string, endDate: string): readonly string[] {
  const start = Date.parse(`${startDate}T00:00:00.000Z`);
  const end = Date.parse(`${endDate}T00:00:00.000Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return [];
  }
  const dates: string[] = [];
  for (let t = start; t <= end; t += 86_400_000) {
    dates.push(new Date(t).toISOString().slice(0, 10));
  }
  return dates;
}
