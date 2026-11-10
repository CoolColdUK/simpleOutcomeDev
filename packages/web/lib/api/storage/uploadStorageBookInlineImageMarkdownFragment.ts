import {
  BUCKET_POD_PRIVATE,
  buildBookOutlineImageObjectPath,
  encodeSoImageMarkdownUri,
  normalizeBookImageMimeFromBlobType,
} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';

export default async function uploadStorageBookInlineImageMarkdownFragment(
  podId: string,
  entryId: string,
  blob: Blob,
): Promise<string> {
  const mime = normalizeBookImageMimeFromBlobType(blob.type);
  if (mime === undefined) {
    throw new Error('Only JPEG, PNG, or WebP images are supported.');
  }
  const supabase = getSupabaseBrowserClient();
  const objectPath = buildBookOutlineImageObjectPath(podId, entryId, mime);
  const {error} = await supabase.storage.from(BUCKET_POD_PRIVATE).upload(objectPath, blob, {
    contentType: mime,
    upsert: false,
  });
  if (error !== null) {
    throw new Error(error.message);
  }
  return `![](${encodeSoImageMarkdownUri(objectPath)})`;
}
