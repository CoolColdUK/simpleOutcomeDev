import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';

export async function deleteDbTpRoute(
  supabase: SupabaseClient<Database>,
  routeId: string,
) {
  return supabase
    .from('tp_route')
    .delete()
    .eq('id', routeId);
}
