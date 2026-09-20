import {parseFpName, type FpBudgetPeriod, type FpCategoryDirection, type FpCategoryFilter} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface UpdateDbFpCategoryInput {
  readonly name?: string;
  readonly direction?: FpCategoryDirection;
  readonly budgetAmount?: number | undefined;
  readonly budgetPeriod?: FpBudgetPeriod | undefined;
  readonly clearBudget?: boolean;
  readonly favourite?: boolean;
  readonly sortOrder?: number;
  readonly filters?: readonly FpCategoryFilter[];
  readonly isGroup?: boolean;
  readonly parentId?: string | undefined;
  readonly clearParent?: boolean;
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
    is_group?: boolean;
    parent_id?: string | null;
  } = {};
  if (input.name !== undefined) {
    patch.name = parseFpName(input.name);
  }
  if (input.direction !== undefined) {
    patch.direction = input.direction;
  }
  if (input.isGroup === true) {
    patch.is_group = true;
    patch.parent_id = null;
    patch.budget_amount = null;
    patch.budget_period = null;
    patch.filters = [];
  } else {
    if (input.isGroup === false) {
      patch.is_group = false;
    }
    if (input.clearBudget === true) {
      patch.budget_amount = null;
      patch.budget_period = null;
    } else {
      if (input.budgetAmount !== undefined) {
        patch.budget_amount = input.budgetAmount;
      }
      if (input.budgetPeriod !== undefined) {
        patch.budget_period = input.budgetPeriod;
      }
    }
    if (input.filters !== undefined) {
      patch.filters = [...input.filters];
    }
    if (input.clearParent === true) {
      patch.parent_id = null;
    } else if (input.parentId !== undefined) {
      patch.parent_id = input.parentId;
    }
  }
  if (input.favourite !== undefined) {
    patch.favourite = input.favourite;
  }
  if (input.sortOrder !== undefined) {
    patch.sort_order = input.sortOrder;
  }
  const {error} = await supabase.from('fp_category').update(patch).eq('id', categoryId);
  throwIfSupabaseError(error);
}
