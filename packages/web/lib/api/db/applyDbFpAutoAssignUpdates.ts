import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface DbFpAutoAssignUpdate {
  readonly transactionId: string;
  readonly categoryId: string;
}

export default async function applyDbFpAutoAssignUpdates(
  updates: readonly DbFpAutoAssignUpdate[],
): Promise<number> {
  const supabase = getSupabaseBrowserClient();
  await Promise.all(
    updates.map(async (u) => {
      const {error} = await supabase
        .from('fp_transaction')
        .update({category_id: u.categoryId, confirmed: false})
        .eq('id', u.transactionId)
        .is('category_id', null);
      throwIfSupabaseError(error);
    }),
  );
  return updates.length;
}
