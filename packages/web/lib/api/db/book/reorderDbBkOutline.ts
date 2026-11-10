import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function reorderDbBkOutline(podId: string, orderedIds: readonly string[]): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('bk_outline_entry').update({sort_order: index}).eq('id', id).eq('pod_id', podId).then(({error}) => throwIfSupabaseError(error)),
    ),
  );
  const {error} = await supabase.rpc('bk_renumber_outline', {p_pod_id: podId});
  throwIfSupabaseError(error);
}
