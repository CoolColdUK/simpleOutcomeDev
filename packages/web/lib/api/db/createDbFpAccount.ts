import {parseFpName, type FpAccountKind} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function createDbFpAccount(
  podId: string,
  name: string,
  kind: FpAccountKind,
  openingFund: number,
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('fp_account')
    .insert({pod_id: podId, name: parseFpName(name), kind, opening_fund: openingFund})
    .select('id')
    .single();
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    throw new Error('create account returned no id');
  }
  return data.id;
}
