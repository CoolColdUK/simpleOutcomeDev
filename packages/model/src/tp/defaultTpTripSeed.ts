export function defaultTpTripTitle(podName: string | null | undefined): string {
  const trimmed = podName?.trim() ?? '';
  return trimmed === '' ? 'Trip' : trimmed;
}

export function defaultTpTripCalendarDateUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
