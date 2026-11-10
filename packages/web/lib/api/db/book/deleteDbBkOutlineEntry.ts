import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function deleteDbBkOutlineEntry(entryId: string, podId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.from('bk_outline_entry').delete().eq('id', entryId).eq('pod_id', podId);
  throwIfSupabaseError(error);
  await supabase.rpc('bk_renumber_outline', {p_pod_id: podId});
}
