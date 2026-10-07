import {buildFpAutoAssignPreview, type FpAutoAssignPreviewRow} from '@so/model';
import listDbFpCategories from '@/lib/api/db/listDbFpCategories';
import listDbFpTransactions from '@/lib/api/db/listDbFpTransactions';

export default async function previewDbFpAutoAssign(podId: string): Promise<readonly FpAutoAssignPreviewRow[]> {
  const [categories, transactions] = await Promise.all([listDbFpCategories(podId), listDbFpTransactions(podId)]);
  const rules = categories.map((c) => ({id: c.id, filters: c.filters, isGroup: c.isGroup}));
  return buildFpAutoAssignPreview(
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
}
