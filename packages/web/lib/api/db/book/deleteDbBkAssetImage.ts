import {BUCKET_POD_PRIVATE} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function deleteDbBkAssetImage(podId: string, imageId: string, storagePath: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.from('bk_asset_image').delete().eq('id', imageId).eq('pod_id', podId);
  throwIfSupabaseError(error);
  await supabase.storage.from(BUCKET_POD_PRIVATE).remove([storagePath]);
}
