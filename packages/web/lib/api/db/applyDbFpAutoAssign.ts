import {matchFpAutoAssignCategory} from '@so/model';
import listDbFpCategories from '@/lib/api/db/listDbFpCategories';
import listDbFpTransactions from '@/lib/api/db/listDbFpTransactions';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function applyDbFpAutoAssign(podId: string): Promise<number> {
  const [categories, transactions] = await Promise.all([listDbFpCategories(podId), listDbFpTransactions(podId)]);
  const rules = categories.map((c) => ({id: c.id, filters: c.filters}));
  const supabase = getSupabaseBrowserClient();
  const targets = transactions.filter((t) => !t.archived && t.categoryId === undefined);
  const updates = targets.flatMap((t) => {
    const categoryId = matchFpAutoAssignCategory(
      {description: t.description, recipient: t.recipient, amount: t.amount},
      rules,
    );
    return categoryId === undefined ? [] : [{id: t.id, categoryId}];
  });
  await Promise.all(
    updates.map(async (u) => {
      const {error} = await supabase
        .from('fp_transaction')
        .update({category_id: u.categoryId, confirmed: false})
        .eq('id', u.id)
        .is('category_id', null);
      throwIfSupabaseError(error);
    }),
  );
  return updates.length;
}
