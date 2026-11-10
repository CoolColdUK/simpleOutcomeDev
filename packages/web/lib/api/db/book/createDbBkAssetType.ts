import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {DbBkAssetType} from '@/lib/api/db/book/loadDbBookWorkspace';

export default async function createDbBkAssetType(podId: string, label: string, slug: string): Promise<DbBkAssetType> {
  const supabase = getSupabaseBrowserClient();
  const maxRes = await supabase.from('bk_asset_type').select('sort_order').eq('pod_id', podId).order('sort_order', {ascending: false}).limit(1);
  throwIfSupabaseError(maxRes.error);
  const sortOrder = maxRes.data?.[0] === undefined ? 0 : maxRes.data[0].sort_order + 1;
  const {data, error} = await supabase
    .from('bk_asset_type')
    .insert({pod_id: podId, slug, label, sort_order: sortOrder, is_system: false})
    .select('*')
    .single();
  throwIfSupabaseError(error);
  if (data === null) {
    throw new Error('Failed to create asset type');
  }
  return {
    id: data.id,
    podId: data.pod_id,
    slug: data.slug,
    label: data.label,
    sortOrder: data.sort_order,
    isSystem: data.is_system,
  };
}
