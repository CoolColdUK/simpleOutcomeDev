import {BUCKET_POD_PRIVATE, type BookImageMime, buildBookAssetImageObjectPath} from '@so/model';
import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';

export default async function uploadStorageBookAssetImageBytes(
  supabase: SupabaseClient<Database>,
  podId: string,
  assetId: string,
  bytes: Uint8Array,
  mime: BookImageMime,
): Promise<string> {
  const objectPath = buildBookAssetImageObjectPath(podId, assetId, mime);
  const {error} = await supabase.storage.from(BUCKET_POD_PRIVATE).upload(objectPath, bytes, {
    contentType: mime,
    upsert: false,
  });
  if (error !== null) {
    throw new Error(error.message);
  }
  return objectPath;
}
