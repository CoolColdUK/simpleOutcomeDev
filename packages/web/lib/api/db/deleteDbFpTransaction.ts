import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function deleteDbFpTransaction(transactionId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.from('fp_transaction').delete().eq('id', transactionId);
  throwIfSupabaseError(error);
}
