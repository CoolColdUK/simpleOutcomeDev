import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

export async function selectTpRouteInDatabase(
  supabase: SupabaseClient<Database>,
  actionId: string,
  routeId: string,
): Promise<{error: Error | null}> {
  const {data: route, error: routeErr} = await supabase
    .from('tp_route')
    .select('id, action_id')
    .eq('id', routeId)
    .maybeSingle();
  if (routeErr !== null) {
    return {error: routeErr};
  }
  if (route === null) {
    return {error: new Error('Route not found')};
  }
  if (route.action_id !== actionId) {
    return {error: new Error('Route does not belong to this travel action')};
  }

  const {data: routes, error: listErr} = await supabase.from('tp_route').select('id').eq('action_id', actionId);
  if (listErr !== null) {
    return {error: listErr};
  }
  const ids = (routes ?? []).map((r) => r.id);
  if (ids.length > 0) {
    const {error: clearErr} = await supabase.from('tp_route').update({is_selected: false}).in('id', ids);
    if (clearErr !== null) {
      return {error: clearErr};
    }
  }
  const {error: pickErr} = await supabase.from('tp_route').update({is_selected: true}).eq('id', routeId);
  if (pickErr !== null) {
    return {error: pickErr};
  }
  const {error: actionErr} = await supabase.from('tp_action').update({selected_route_id: routeId}).eq('id', actionId);
  return {error: actionErr};
}

export default async function selectDbTpRoute(actionId: string, routeId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const result = await selectTpRouteInDatabase(supabase, actionId, routeId);
  throwIfSupabaseError(result.error);
}

export interface SelectTpRouteInput {
  readonly actionId: string;
  readonly routeId: string;
}

export async function selectDbTpRouteForAgent(
  supabase: SupabaseClient<Database>,
  input: SelectTpRouteInput,
) {
  const result = await selectTpRouteInDatabase(supabase, input.actionId, input.routeId);
  if (result.error !== null) {
    return {data: null, error: result.error};
  }
  return supabase.from('tp_action').select('*').eq('id', input.actionId).single();
}
