import {parseFpName, type FpBudgetPeriod, type FpCategoryDirection, type FpCategoryFilter} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function createDbFpCategory(
  podId: string,
  name: string,
  direction: FpCategoryDirection,
  options?: {
    readonly budgetAmount?: number;
    readonly budgetPeriod?: FpBudgetPeriod;
    readonly favourite?: boolean;
    readonly filters?: readonly FpCategoryFilter[];
    readonly isGroup?: boolean;
    readonly parentId?: string;
  },
): Promise<string> {
  const isGroup = options?.isGroup === true;
  if (isGroup && options?.parentId !== undefined) {
    throw new Error('group categories cannot have a parent');
  }
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('fp_category')
    .insert({
      pod_id: podId,
      name: parseFpName(name),
      direction,
      budget_amount: isGroup ? undefined : options?.budgetAmount,
      budget_period: isGroup ? undefined : options?.budgetPeriod,
      favourite: options?.favourite ?? false,
      filters: isGroup ? [] : (options?.filters ?? []),
      is_group: isGroup,
      parent_id: isGroup ? undefined : options?.parentId,
    })
    .select('id')
    .single();
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    throw new Error('create category returned no id');
  }
  return data.id;
}
