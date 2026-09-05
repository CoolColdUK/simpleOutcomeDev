import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import {mapDbFpTransaction, type DbFpTransaction} from '@/lib/api/db/mapDbFpTransaction';

export default async function listDbFpTransactions(
  podId: string,
  options?: {
    readonly startDate?: string;
    readonly endDate?: string;
    readonly accountId?: string;
    readonly archived?: boolean;
  },
): Promise<readonly DbFpTransaction[]> {
  const supabase = getSupabaseBrowserClient();
  let query = supabase
    .from('fp_transaction')
    .select(
      'id, pod_id, account_id, posted_date, posted_time, amount, description, recipient, notes, external_id, category_id, confirmed, parser_id, import_id, archived, parent_id, split_portion_count, split_recurrence, created_by',
    )
    .eq('pod_id', podId)
    .order('posted_date', {ascending: false});
  if (options?.startDate !== undefined) {
    query = query.gte('posted_date', options.startDate);
  }
  if (options?.endDate !== undefined) {
    query = query.lte('posted_date', options.endDate);
  }
  if (options?.accountId !== undefined) {
    query = query.eq('account_id', options.accountId);
  }
  if (options?.archived !== undefined) {
    query = query.eq('archived', options.archived);
  }
  const {data, error} = await query;
  throwIfSupabaseError(error);
  return (data ?? []).map(mapDbFpTransaction);
}
