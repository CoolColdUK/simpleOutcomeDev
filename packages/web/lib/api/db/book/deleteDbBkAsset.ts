import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function deleteDbBkAsset(assetId: string, podId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.from('bk_asset').delete().eq('id', assetId).eq('pod_id', podId);
  throwIfSupabaseError(error);
}
