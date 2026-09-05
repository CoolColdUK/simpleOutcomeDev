import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function confirmDbFpTransactions(transactionIds: readonly string[]): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.from('fp_transaction').update({confirmed: true}).in('id', [...transactionIds]);
  throwIfSupabaseError(error);
}
