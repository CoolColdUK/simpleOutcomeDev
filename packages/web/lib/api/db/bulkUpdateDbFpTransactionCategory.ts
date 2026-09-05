import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function bulkUpdateDbFpTransactionCategory(
  transactionIds: readonly string[],
  categoryId: string,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase
    .from('fp_transaction')
    .update({category_id: categoryId, confirmed: true})
    .in('id', [...transactionIds]);
  throwIfSupabaseError(error);
}
