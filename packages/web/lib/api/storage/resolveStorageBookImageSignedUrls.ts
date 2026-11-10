import {BUCKET_POD_PRIVATE, extractSoImageObjectPathsFromBody, replaceSoImageMarkdownSrc} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';

export default async function resolveStorageBookImageSignedUrls(markdown: string): Promise<string> {
  const paths = extractSoImageObjectPathsFromBody(markdown);
  if (paths.length === 0) {
    return markdown;
  }
  const supabase = getSupabaseBrowserClient();
  const unique = [...new Set(paths)];
  const signedByPath = (
    await Promise.all(
      unique.map(async (path) => {
        const {data, error} = await supabase.storage.from(BUCKET_POD_PRIVATE).createSignedUrl(path, 60 * 60);
        if (error !== null || data === null) {
          return undefined;
        }
        return {path, url: data.signedUrl};
      }),
    )
  ).filter((entry): entry is {path: string; url: string} => entry !== undefined);
  return signedByPath.reduce((acc, entry) => replaceSoImageMarkdownSrc(acc, entry.path, entry.url), markdown);
}
