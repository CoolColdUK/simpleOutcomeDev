import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {DbBkAssetImage} from '@/lib/api/db/book/loadDbBookWorkspace';

export default async function createDbBkAssetImage(
  podId: string,
  assetId: string,
  storagePath: string,
  caption: string | undefined = undefined,
): Promise<DbBkAssetImage> {
  const supabase = getSupabaseBrowserClient();
  const maxRes = await supabase
    .from('bk_asset_image')
    .select('sort_order')
    .eq('asset_id', assetId)
    .order('sort_order', {ascending: false})
    .limit(1);
  throwIfSupabaseError(maxRes.error);
  const sortOrder = maxRes.data?.[0] === undefined ? 0 : maxRes.data[0].sort_order + 1;
  const {data, error} = await supabase
    .from('bk_asset_image')
    .insert({
      pod_id: podId,
      asset_id: assetId,
      storage_path: storagePath,
      sort_order: sortOrder,
      caption: caption ?? null,
    })
    .select('*')
    .single();
  throwIfSupabaseError(error);
  if (data === null) {
    throw new Error('Failed to create asset image');
  }
  return {
    id: data.id,
    assetId: data.asset_id,
    podId: data.pod_id,
    storagePath: data.storage_path,
    sortOrder: data.sort_order,
    caption: data.caption ?? undefined,
  };
}
