import {BUCKET_POD_PRIVATE, buildBookCoverObjectPath, normalizeBookImageMimeFromBlobType} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import bookStorageUploadOptions from '@/lib/api/storage/bookStorageUploadOptions';

export default async function uploadStorageBookCover(podId: string, blob: Blob): Promise<string> {
  const mime = normalizeBookImageMimeFromBlobType(blob.type);
  if (mime === undefined) {
    throw new Error('Only JPEG, PNG, or WebP images are supported.');
  }
  const supabase = getSupabaseBrowserClient();
  const objectPath = buildBookCoverObjectPath(podId, mime);
  const {error} = await supabase.storage.from(BUCKET_POD_PRIVATE).upload(objectPath, blob, bookStorageUploadOptions(mime));
  if (error !== null) {
    throw new Error(error.message);
  }
  return objectPath;
}
