import {extractSoImageObjectPathsFromBody, replaceSoImageMarkdownSrc} from '@so/model';
import {getStorageBookSignedUrls} from '@/lib/api/storage/storageBookSignedUrlCache';

export default async function resolveStorageBookImageSignedUrls(markdown: string): Promise<string> {
  const paths = extractSoImageObjectPathsFromBody(markdown);
  if (paths.length === 0) {
    return markdown;
  }
  const signedByPath = await getStorageBookSignedUrls(paths);
  return Object.entries(signedByPath).reduce((acc, [path, url]) => replaceSoImageMarkdownSrc(acc, path, url), markdown);
}
