import {BUCKET_POD_PRIVATE, BOOK_POD_PRIVATE_SIGNED_URL_SECONDS} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';

const REFRESH_BUFFER_MS = 5 * 60 * 1000;

interface CacheEntry {
  readonly url: string;
  readonly expiresAtMs: number;
}

const cache = new Map<string, CacheEntry>();

function cacheHit(entry: CacheEntry, now: number): boolean {
  return entry.expiresAtMs - REFRESH_BUFFER_MS > now;
}

export async function getStorageBookSignedUrls(paths: readonly string[]): Promise<Readonly<Record<string, string>>> {
  const unique = [...new Set(paths.filter((path) => path !== ''))];
  if (unique.length === 0) {
    return {};
  }
  const now = Date.now();
  const result: Record<string, string> = {};
  const missing: string[] = [];
  for (const path of unique) {
    const hit = cache.get(path);
    if (hit !== undefined && cacheHit(hit, now)) {
      result[path] = hit.url;
    } else {
      missing.push(path);
    }
  }
  if (missing.length === 0) {
    return result;
  }
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase.storage
    .from(BUCKET_POD_PRIVATE)
    .createSignedUrls([...missing], BOOK_POD_PRIVATE_SIGNED_URL_SECONDS);
  if (error !== null) {
    throw new Error(error.message);
  }
  const expiresAtMs = now + BOOK_POD_PRIVATE_SIGNED_URL_SECONDS * 1000;
  for (const row of data ?? []) {
    if (row.path === null || row.signedUrl === null || row.signedUrl === '') {
      continue;
    }
    cache.set(row.path, {url: row.signedUrl, expiresAtMs});
    result[row.path] = row.signedUrl;
  }
  return result;
}

export async function getStorageBookSignedUrl(path: string): Promise<string | undefined> {
  const map = await getStorageBookSignedUrls([path]);
  return map[path];
}
