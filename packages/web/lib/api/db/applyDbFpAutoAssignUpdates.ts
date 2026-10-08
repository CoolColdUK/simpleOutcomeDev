import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface DbFpAutoAssignUpdate {
  readonly transactionId: string;
  readonly categoryId: string;
}

export interface DbFpAutoAssignApplyOptions {
  /** When true, user explicitly accepted assignment (re-run dialog). Default false (e.g. post-import). */
  readonly confirmed?: boolean;
}

export default async function applyDbFpAutoAssignUpdates(
  updates: readonly DbFpAutoAssignUpdate[],
  options?: DbFpAutoAssignApplyOptions,
): Promise<number> {
  const confirmed = options?.confirmed === true;
  const supabase = getSupabaseBrowserClient();
  await Promise.all(
    updates.map(async (u) => {
      const {error} = await supabase
        .from('fp_transaction')
        .update({category_id: u.categoryId, confirmed})
        .eq('id', u.transactionId)
        .is('category_id', null);
      throwIfSupabaseError(error);
    }),
  );
  return updates.length;
}
