import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function createDbFpTransaction(
  podId: string,
  accountId: string,
  createdBy: string,
  postedDate: string,
  amount: number,
  fields?: {
    readonly postedTime?: string;
    readonly description?: string;
    readonly recipient?: string;
    readonly notes?: string;
    readonly categoryId?: string;
  },
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('fp_transaction')
    .insert({
      pod_id: podId,
      account_id: accountId,
      created_by: createdBy,
      posted_date: postedDate,
      amount,
      posted_time: fields?.postedTime,
      description: fields?.description ?? '',
      recipient: fields?.recipient ?? '',
      notes: fields?.notes ?? '',
      category_id: fields?.categoryId,
      confirmed: true,
    })
    .select('id')
    .single();
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    throw new Error('create transaction returned no id');
  }
  return data.id;
}
