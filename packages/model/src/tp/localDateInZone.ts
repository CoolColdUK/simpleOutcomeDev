export default function localDateInZone(instantIso: string, ianaZone: string): string {
  const date = new Date(instantIso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('en-CA', {timeZone: ianaZone, year: 'numeric', month: '2-digit', day: '2-digit'}).format(date);
}
