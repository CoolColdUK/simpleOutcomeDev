import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';

export interface SelectTpRouteInput {
  readonly actionId: string;
  readonly routeId: string;
}

export async function selectDbTpRoute(
  supabase: SupabaseClient<Database>,
  input: SelectTpRouteInput,
) {
  return supabase
    .from('tp_action')
    .update({selected_route_id: input.routeId})
    .eq('id', input.actionId)
    .select('*')
    .single();
}
