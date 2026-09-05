import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function deleteDbFpBillSplit(parentId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error: delError} = await supabase.from('fp_transaction').delete().eq('parent_id', parentId);
  throwIfSupabaseError(delError);
  const {error: updateError} = await supabase
    .from('fp_transaction')
    .update({split_portion_count: null, split_recurrence: null})
    .eq('id', parentId);
  throwIfSupabaseError(updateError);
}
