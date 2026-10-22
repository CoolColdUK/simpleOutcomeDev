export default function formatTpInstant(instantIso: string, ianaZone: string): string {
  const date = new Date(instantIso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ianaZone,
    timeZoneName: 'short',
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '';
  const zone = parts.find((p) => p.type === 'timeZoneName')?.value ?? ianaZone;
  return `${hour}:${minute} ${zone}`;
}
