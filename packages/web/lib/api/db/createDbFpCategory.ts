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
  },
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('fp_category')
    .insert({
      pod_id: podId,
      name: parseFpName(name),
      direction,
      budget_amount: options?.budgetAmount,
      budget_period: options?.budgetPeriod,
      favourite: options?.favourite ?? false,
      filters: options?.filters ?? [],
    })
    .select('id')
    .single();
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    throw new Error('create category returned no id');
  }
  return data.id;
}
