import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

export default async function deleteDbTpRoute(routeId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.from('tp_route').delete().eq('id', routeId);
  throwIfSupabaseError(error);
}

export async function deleteDbTpRouteForAgent(
  supabase: SupabaseClient<Database>,
  routeId: string,
) {
  return supabase
    .from('tp_route')
    .delete()
    .eq('id', routeId);
}
