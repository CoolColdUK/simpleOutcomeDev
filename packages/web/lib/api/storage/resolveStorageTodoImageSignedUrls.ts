import {BUCKET_POD_PRIVATE, encodeSoImageMarkdownUri, extractSoImageObjectPathsFromBody} from '@so/model';
import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';

export default async function resolveStorageTodoImageSignedUrls(
  markdown: string,
  supabaseClient?: SupabaseClient,
): Promise<string> {
  const paths = extractSoImageObjectPathsFromBody(markdown);
  if (paths.length === 0) {
    return markdown;
  }
  const supabase = supabaseClient ?? getSupabaseBrowserClient();
  const signedByPath = await Promise.all(
    paths.map(async (path) => {
      const {data, error} = await supabase.storage.from(BUCKET_POD_PRIVATE).createSignedUrl(path, 60 * 60);
      if (error !== null || data?.signedUrl === undefined) {
        return {path, url: ''};
      }
      return {path, url: data.signedUrl};
    }),
  );
  return signedByPath.reduce((acc, entry) => {
    if (entry.url === '') {
      return acc;
    }
    const needle = `](${encodeSoImageMarkdownUri(entry.path)})`;
    return acc.split(needle).join(`](${entry.url})`);
  }, markdown);
}
