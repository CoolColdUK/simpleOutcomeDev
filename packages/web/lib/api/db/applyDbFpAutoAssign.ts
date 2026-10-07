import {buildFpAutoAssignPreview} from '@so/model';
import listDbFpCategories from '@/lib/api/db/listDbFpCategories';
import listDbFpTransactions from '@/lib/api/db/listDbFpTransactions';
import applyDbFpAutoAssignUpdates from '@/lib/api/db/applyDbFpAutoAssignUpdates';

export default async function applyDbFpAutoAssign(podId: string): Promise<number> {
  const [categories, transactions] = await Promise.all([listDbFpCategories(podId), listDbFpTransactions(podId)]);
  const rules = categories.map((c) => ({id: c.id, filters: c.filters, isGroup: c.isGroup}));
  const updates = buildFpAutoAssignPreview(
    transactions.map((t) => ({
      id: t.id,
      accountId: t.accountId,
      postedDate: t.postedDate,
      description: t.description,
      recipient: t.recipient,
      amount: t.amount,
      archived: t.archived,
      categoryId: t.categoryId,
    })),
    rules,
  );
  return applyDbFpAutoAssignUpdates(
    updates.map((u) => ({transactionId: u.transactionId, categoryId: u.categoryId})),
  );
}
