/**
 * Trims a string when it is non-empty.
 */
export default function trimStringOptional(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  return trimmed !== undefined && trimmed !== '' ? trimmed : undefined;
}
