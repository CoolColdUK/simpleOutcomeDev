import {BUCKET_POD_PRIVATE} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

function signedUrlPair(row: {
  readonly error: string | null;
  readonly path: string | null;
  readonly signedUrl: string | null;
}): readonly [string, string] | undefined {
  if (row.error !== null || row.path === null || row.signedUrl === null || row.signedUrl === '') {
    return undefined;
  }
  return [row.path, row.signedUrl];
}

export default async function listStorageTodoCardIconSignedUrls(
  paths: readonly string[],
): Promise<Readonly<Record<string, string>>> {
  const unique = [...new Set(paths)];
  if (unique.length === 0) {
    return {};
  }
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase.storage.from(BUCKET_POD_PRIVATE).createSignedUrls([...unique], 60 * 60);
  throwIfSupabaseError(error);
  return Object.fromEntries((data ?? []).flatMap((row) => {
    const pair = signedUrlPair(row);
    return pair === undefined ? [] : [pair];
  }));
}
