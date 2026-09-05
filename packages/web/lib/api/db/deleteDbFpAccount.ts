import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function deleteDbFpAccount(accountId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.from('fp_account').delete().eq('id', accountId);
  throwIfSupabaseError(error);
}
