const DEFAULT_RETURN_URL = '/app';

export default function resolveSafeReturnUrl(raw: string | null): string {
  if (raw === null || raw === '') {
    return DEFAULT_RETURN_URL;
  }
  if (!raw.startsWith('/') || raw.startsWith('//')) {
    return DEFAULT_RETURN_URL;
  }
  return raw;
}
