import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function sumDbFpAccountBalance(accountId: string): Promise<number> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase.rpc('sum_fp_account_balance', {p_account_id: accountId});
  throwIfSupabaseError(error);
  return Number(data ?? 0);
}
