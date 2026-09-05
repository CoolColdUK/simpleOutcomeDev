import {createFpSplitChildren, FpSplitRecurrence} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import {mapDbFpTransaction} from '@/lib/api/db/mapDbFpTransaction';

export default async function createDbFpBillSplit(
  parentId: string,
  createdBy: string,
  portionCount: number,
  startDate: string,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {data: parentRow, error: parentError} = await supabase
    .from('fp_transaction')
    .select(
      'id, pod_id, account_id, posted_date, posted_time, amount, description, recipient, notes, external_id, category_id, confirmed, parser_id, import_id, archived, parent_id, split_portion_count, split_recurrence, created_by',
    )
    .eq('id', parentId)
    .single();
  throwIfSupabaseError(parentError);
  if (parentRow === undefined || parentRow === null) {
    throw new Error('parent not found');
  }
  const parent = mapDbFpTransaction(parentRow);
  if (parent.parentId !== undefined) {
    throw new Error('cannot split a child');
  }
  const {data: existing, error: existingError} = await supabase
    .from('fp_transaction')
    .select('id')
    .eq('parent_id', parentId);
  throwIfSupabaseError(existingError);
  if ((existing ?? []).length > 0) {
    throw new Error('parent already has children');
  }
  const children = createFpSplitChildren(parent.amount, startDate, portionCount, FpSplitRecurrence.MONTHLY);
  if (children.length === 0) {
    throw new Error('invalid split');
  }
  const {error: insertError} = await supabase.from('fp_transaction').insert(
    children.map((c) => ({
      pod_id: parent.podId,
      account_id: parent.accountId,
      posted_date: c.postedDate,
      amount: c.amount,
      description: parent.description,
      recipient: parent.recipient,
      notes: parent.notes,
      category_id: parent.categoryId,
      confirmed: true,
      parent_id: parent.id,
      created_by: createdBy,
    })),
  );
  throwIfSupabaseError(insertError);
  const {error: updateError} = await supabase
    .from('fp_transaction')
    .update({split_portion_count: portionCount, split_recurrence: FpSplitRecurrence.MONTHLY})
    .eq('id', parentId);
  throwIfSupabaseError(updateError);
}
