/**
 * Removes a trailing slash from a string when it exists.
 */
export default function removeStringTrailingSlash(raw: string): string {
  return raw.endsWith('/') && raw.length > 1 ? raw.slice(0, -1) : raw;
}
