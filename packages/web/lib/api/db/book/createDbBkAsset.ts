import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {DbBkAsset} from '@/lib/api/db/book/loadDbBookWorkspace';

export default async function createDbBkAsset(podId: string, assetTypeId: string, name: string): Promise<DbBkAsset> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('bk_asset')
    .insert({pod_id: podId, asset_type_id: assetTypeId, name})
    .select('*')
    .single();
  throwIfSupabaseError(error);
  if (data === null) {
    throw new Error('Failed to create asset');
  }
  return {
    id: data.id,
    podId: data.pod_id,
    assetTypeId: data.asset_type_id,
    name: data.name,
    descriptionMd: data.description_md,
    sortOrder: data.sort_order,
    images: [],
  };
}
