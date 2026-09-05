import {parseFpName, type FpBudgetPeriod, type FpCategoryDirection, type FpCategoryFilter} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface UpdateDbFpCategoryInput {
  readonly name?: string;
  readonly direction?: FpCategoryDirection;
  readonly budgetAmount?: number | undefined;
  readonly budgetPeriod?: FpBudgetPeriod | undefined;
  readonly favourite?: boolean;
  readonly sortOrder?: number;
  readonly filters?: readonly FpCategoryFilter[];
}

export default async function updateDbFpCategory(categoryId: string, input: UpdateDbFpCategoryInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const patch: {
    name?: string;
    direction?: string;
    budget_amount?: number | null;
    budget_period?: string | null;
    favourite?: boolean;
    sort_order?: number;
    filters?: FpCategoryFilter[];
  } = {};
  if (input.name !== undefined) {
    patch.name = parseFpName(input.name);
  }
  if (input.direction !== undefined) {
    patch.direction = input.direction;
  }
  if (input.budgetAmount !== undefined) {
    patch.budget_amount = input.budgetAmount;
  }
  if (input.budgetPeriod !== undefined) {
    patch.budget_period = input.budgetPeriod;
  }
  if (input.favourite !== undefined) {
    patch.favourite = input.favourite;
  }
  if (input.sortOrder !== undefined) {
    patch.sort_order = input.sortOrder;
  }
  if (input.filters !== undefined) {
    patch.filters = [...input.filters];
  }
  const {error} = await supabase.from('fp_category').update(patch).eq('id', categoryId);
  throwIfSupabaseError(error);
}
