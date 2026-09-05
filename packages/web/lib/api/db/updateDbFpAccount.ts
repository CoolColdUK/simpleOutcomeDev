import {parseFpName, type FpAccountKind} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface UpdateDbFpAccountInput {
  readonly name?: string;
  readonly kind?: FpAccountKind;
  readonly openingFund?: number;
  readonly archived?: boolean;
  readonly notes?: string;
}

export default async function updateDbFpAccount(accountId: string, input: UpdateDbFpAccountInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const patch: {
    name?: string;
    kind?: string;
    opening_fund?: number;
    archived?: boolean;
    notes?: string | null;
  } = {};
  if (input.name !== undefined) {
    patch.name = parseFpName(input.name);
  }
  if (input.kind !== undefined) {
    patch.kind = input.kind;
  }
  if (input.openingFund !== undefined) {
    patch.opening_fund = input.openingFund;
  }
  if (input.archived !== undefined) {
    patch.archived = input.archived;
  }
  if (input.notes !== undefined) {
    patch.notes = input.notes === '' ? null : input.notes;
  }
  const {error} = await supabase.from('fp_account').update(patch).eq('id', accountId);
  throwIfSupabaseError(error);
}
