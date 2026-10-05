import bulkUpdateDbFpTransactionCategory from '@/lib/api/db/bulkUpdateDbFpTransactionCategory';
import updateDbFpTransaction from '@/lib/api/db/updateDbFpTransaction';

export default async function assignDbFpTransactionCategory(
  transactionId: string,
  categoryId: string | undefined,
): Promise<void> {
  if (categoryId === undefined) {
    await updateDbFpTransaction(transactionId, {categoryId: undefined});
    return;
  }
  await bulkUpdateDbFpTransactionCategory([transactionId], categoryId);
}
