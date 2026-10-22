/**
 * Timezone conversion helpers for trip planning
 *
 * Inputs: local wall time + IANA timezone
 * Storage: UTC instant (timestamptz) + IANA timezone (text)
 * Outputs: both local time + zone and UTC instant
 */

interface WallTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function assertValidIanaZone(ianaZone: string): void {
  try {
    new Intl.DateTimeFormat('en-US', {timeZone: ianaZone});
  } catch {
    throw new Error(`Invalid IANA timezone: ${ianaZone}`);
  }
}

function parseLocalWallTime(localTime: string): WallTimeParts {
  const match = localTime.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    throw new Error(`Invalid local time format: ${localTime}`);
  }

  const year = match[1];
  const month = match[2];
  const day = match[3];
  const hour = match[4];
  const minute = match[5];
  const second = match[6] ?? '00';

  return {
    year: parseInt(year, 10),
    month: parseInt(month, 10),
    day: parseInt(day, 10),
    hour: parseInt(hour, 10),
    minute: parseInt(minute, 10),
    second: parseInt(second, 10),
  };
}

function formatUtcInZone(utcDate: Date, ianaZone: string): string {
  return utcDate.toLocaleString('en-US', {
    timeZone: ianaZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function parseUsLocaleDateTime(formatted: string): WallTimeParts {
  const tzMatch = formatted.match(/(\d+)\/(\d+)\/(\d+),\s*(\d+):(\d+):(\d+)/);
  if (!tzMatch) {
    throw new Error(`Failed to parse formatted date: ${formatted}`);
  }

  const month = tzMatch[1];
  const day = tzMatch[2];
  const year = tzMatch[3];
  const hour = tzMatch[4];
  const minute = tzMatch[5];
  const second = tzMatch[6];

  return {
    year: parseInt(year, 10),
    month: parseInt(month, 10),
    day: parseInt(day, 10),
    hour: parseInt(hour, 10),
    minute: parseInt(minute, 10),
    second: parseInt(second, 10),
  };
}

function wallTimeToUtcMillis(parts: WallTimeParts): number {
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
}

/**
 * Convert local wall time + timezone to UTC instant
 */
export function localTimeToUtc(localTime: string, ianaZone: string): string {
  const wall = parseLocalWallTime(localTime);
  assertValidIanaZone(ianaZone);

  const localIso = `${String(wall.year).padStart(4, '0')}-${String(wall.month).padStart(2, '0')}-${String(wall.day).padStart(2, '0')}T${String(wall.hour).padStart(2, '0')}:${String(wall.minute).padStart(2, '0')}:${String(wall.second).padStart(2, '0')}`;

  const utcMillis = wallTimeToUtcMillis(wall);
  const utcDate = new Date(`${localIso}Z`);
  const utcMilliseconds = utcDate.getTime();

  const inTargetZone = formatUtcInZone(utcDate, ianaZone);
  const targetParts = parseUsLocaleDateTime(inTargetZone);
  const targetMillis = wallTimeToUtcMillis(targetParts);

  const offsetMs = utcMilliseconds - targetMillis;
  const desiredUtcMs = utcMillis - offsetMs;

  return new Date(desiredUtcMs).toISOString();
}

/**
 * Convert UTC instant + timezone to local wall time
 */
export function utcToLocalTime(utcInstant: string, ianaZone: string): string {
  const date = new Date(utcInstant);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid UTC instant: ${utcInstant}`);
  }

  assertValidIanaZone(ianaZone);

  const formatted = formatUtcInZone(date, ianaZone);
  const parts = parseUsLocaleDateTime(formatted);

  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}T${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}:${String(parts.second).padStart(2, '0')}`;
}

/**
 * Format instant for display with timezone abbreviation
 */
export function formatTpInstant(utcInstant: string, ianaZone: string): string {
  const date = new Date(utcInstant);

  const formattedParts = new Intl.DateTimeFormat('en-US', {
    timeZone: ianaZone,
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    hour12: false,
  }).formatToParts(date);

  const hour = formattedParts.find((p) => p.type === 'hour')?.value ?? '';
  const minute = formattedParts.find((p) => p.type === 'minute')?.value ?? '';
  const tz = formattedParts.find((p) => p.type === 'timeZoneName')?.value ?? '';

  return `${hour}:${minute} ${tz}`;
}
