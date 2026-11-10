import {
  BUCKET_POD_PRIVATE,
  buildBookAssetImageObjectPath,
  encodeSoImageMarkdownUri,
  normalizeBookImageMimeFromBlobType,
} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';

export default async function uploadStorageBookAssetInlineImageMarkdownFragment(
  podId: string,
  assetId: string,
  blob: Blob,
): Promise<{fragment: string; storagePath: string}> {
  const mime = normalizeBookImageMimeFromBlobType(blob.type);
  if (mime === undefined) {
    throw new Error('Only JPEG, PNG, or WebP images are supported.');
  }
  const supabase = getSupabaseBrowserClient();
  const objectPath = buildBookAssetImageObjectPath(podId, assetId, mime);
  const {error} = await supabase.storage.from(BUCKET_POD_PRIVATE).upload(objectPath, blob, {
    contentType: mime,
    upsert: false,
  });
  if (error !== null) {
    throw new Error(error.message);
  }
  return {fragment: `![](${encodeSoImageMarkdownUri(objectPath)})`, storagePath: objectPath};
}
