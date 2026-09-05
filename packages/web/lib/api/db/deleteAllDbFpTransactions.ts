import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function deleteAllDbFpTransactions(podId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.rpc('delete_all_fp_transactions', {p_pod_id: podId});
  throwIfSupabaseError(error);
}
