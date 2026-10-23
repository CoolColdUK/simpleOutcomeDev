import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';
import updateDbTpAction from '@/lib/api/db/tp/updateDbTpAction';

export default async function selectDbTpRoute(actionId: string, routeId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {data: routes, error: listErr} = await supabase.from('tp_route').select('id').eq('action_id', actionId);
  throwIfSupabaseError(listErr);
  const ids = (routes ?? []).map((r) => r.id);
  if (ids.length > 0) {
    const {error: clearErr} = await supabase.from('tp_route').update({is_selected: false}).in('id', ids);
    throwIfSupabaseError(clearErr);
  }
  const {error: pickErr} = await supabase.from('tp_route').update({is_selected: true}).eq('id', routeId);
  throwIfSupabaseError(pickErr);
  await updateDbTpAction(actionId, {selectedRouteId: routeId});
}

export interface SelectTpRouteInput {
  readonly actionId: string;
  readonly routeId: string;
}

export async function selectDbTpRouteForAgent(
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
