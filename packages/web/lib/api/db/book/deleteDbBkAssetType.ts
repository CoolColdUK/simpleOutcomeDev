import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function deleteDbBkAssetType(podId: string, assetTypeId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const countRes = await supabase.from('bk_asset').select('id', {count: 'exact', head: true}).eq('asset_type_id', assetTypeId);
  throwIfSupabaseError(countRes.error);
  if ((countRes.count ?? 0) > 0) {
    throw new Error('Remove all assets in this type before deleting it');
  }
  const typeRes = await supabase.from('bk_asset_type').select('is_system').eq('id', assetTypeId).eq('pod_id', podId).maybeSingle();
  throwIfSupabaseError(typeRes.error);
  if (typeRes.data?.is_system === true) {
    throw new Error('System asset types cannot be deleted');
  }
  const {error} = await supabase.from('bk_asset_type').delete().eq('id', assetTypeId).eq('pod_id', podId);
  throwIfSupabaseError(error);
}
