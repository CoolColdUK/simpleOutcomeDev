import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import {mapDbFpAccount, type DbFpAccount} from '@/lib/api/db/mapDbFpAccount';

export default async function listDbFpAccounts(podId: string): Promise<readonly DbFpAccount[]> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('fp_account')
    .select('id, pod_id, name, kind, opening_fund, archived, notes')
    .eq('pod_id', podId)
    .order('name', {ascending: true});
  throwIfSupabaseError(error);
  return (data ?? []).map(mapDbFpAccount);
}
