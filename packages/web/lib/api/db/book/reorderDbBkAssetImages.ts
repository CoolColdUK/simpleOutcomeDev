import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function reorderDbBkAssetImages(podId: string, assetId: string, orderedImageIds: readonly string[]): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await Promise.all(
    orderedImageIds.map((id, index) =>
      supabase.from('bk_asset_image').update({sort_order: index}).eq('id', id).eq('asset_id', assetId).eq('pod_id', podId),
    ),
  );
  const check = await supabase.from('bk_asset_image').select('id').eq('asset_id', assetId).eq('pod_id', podId);
  throwIfSupabaseError(check.error);
}
