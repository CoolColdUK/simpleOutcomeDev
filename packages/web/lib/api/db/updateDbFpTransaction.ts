import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface UpdateDbFpTransactionInput {
  readonly postedDate?: string;
  readonly amount?: number;
  readonly description?: string;
  readonly recipient?: string;
  readonly notes?: string;
  readonly categoryId?: string | undefined;
  readonly confirmed?: boolean;
  readonly archived?: boolean;
}

export default async function updateDbFpTransaction(
  transactionId: string,
  input: UpdateDbFpTransactionInput,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const patch: {
    posted_date?: string;
    amount?: number;
    description?: string;
    recipient?: string;
    notes?: string;
    category_id?: string | null;
    confirmed?: boolean;
    archived?: boolean;
  } = {};
  if (input.postedDate !== undefined) {
    patch.posted_date = input.postedDate;
  }
  if (input.amount !== undefined) {
    patch.amount = input.amount;
  }
  if (input.description !== undefined) {
    patch.description = input.description;
  }
  if (input.recipient !== undefined) {
    patch.recipient = input.recipient;
  }
  if (input.notes !== undefined) {
    patch.notes = input.notes;
  }
  if (input.categoryId !== undefined) {
    patch.category_id = input.categoryId === '' ? null : input.categoryId;
  }
  if (input.confirmed !== undefined) {
    patch.confirmed = input.confirmed;
  }
  if (input.archived !== undefined) {
    patch.archived = input.archived;
  }
  const {error} = await supabase.from('fp_transaction').update(patch).eq('id', transactionId);
  throwIfSupabaseError(error);
}
