import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import {mapDbFpCategory, type DbFpCategory} from '@/lib/api/db/mapDbFpCategory';

export default async function listDbFpCategories(podId: string): Promise<readonly DbFpCategory[]> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('fp_category')
    .select(
      'id, pod_id, name, direction, budget_amount, budget_period, favourite, sort_order, colour, filters',
    )
    .eq('pod_id', podId)
    .order('sort_order', {ascending: true})
    .order('name', {ascending: true});
  throwIfSupabaseError(error);
  return (data ?? []).map(mapDbFpCategory);
}
