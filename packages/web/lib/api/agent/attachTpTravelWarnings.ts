import type {SupabaseClient} from '@supabase/supabase-js';
import {collectTpTravelWarnings, payloadWithTpWarnings, type TpAgentWarning} from '@so/model';
import type {Database} from '@/lib/supabase/database';

type WarningClient = SupabaseClient<Database>;

export async function withTpTravelWarnings<T extends object>(
  supabase: WarningClient,
  actionId: string,
  payload: T,
): Promise<T | (T & {readonly warnings: readonly TpAgentWarning[]})> {
  const warnings = await loadTpTravelWarnings(supabase, actionId);
  return payloadWithTpWarnings(payload, warnings);
}

export async function withTpTravelWarningsForRoute<T extends object>(
  supabase: WarningClient,
  routeId: string,
  payload: T,
): Promise<T | (T & {readonly warnings: readonly TpAgentWarning[]})> {
  const route = await supabase.from('tp_route').select('action_id').eq('id', routeId).maybeSingle();
  if (route.error !== null || route.data === null) {
    if (route.error !== null) {
      console.error('travel warnings route', route.error);
    }
    return payload;
  }
  return withTpTravelWarnings(supabase, route.data.action_id, payload);
}

async function loadTpTravelWarnings(supabase: WarningClient, actionId: string): Promise<readonly TpAgentWarning[]> {
  const action = await supabase
    .from('tp_action')
    .select('kind, selected_route_id, from_place, to_place')
    .eq('id', actionId)
    .maybeSingle();
  if (action.error !== null || action.data === null || action.data.kind !== 'travel') {
    if (action.error !== null) {
      console.error('travel warnings action', action.error);
    }
    return [];
  }
  const selectedRouteId = action.data.selected_route_id ?? undefined;
  const [steps, links] = await Promise.all([
    selectedRouteId === undefined
      ? Promise.resolve({data: [], error: null})
      : supabase
          .from('tp_transport')
          .select('id, sort_order, transport_lib_id, mode, from_place, to_place')
          .eq('route_id', selectedRouteId),
    supabase.from('tp_action_transport').select('id').eq('action_id', actionId),
  ]);
  if (steps.error !== null || links.error !== null) {
    console.error('travel warnings rows', steps.error ?? links.error);
    return [];
  }
  return collectTpTravelWarnings({
    kind: action.data.kind,
    selectedRouteId,
    fromPlace: action.data.from_place ?? undefined,
    toPlace: action.data.to_place ?? undefined,
    steps: (steps.data ?? []).map((step) => ({
      id: step.id,
      sortOrder: step.sort_order,
      transportLibId: step.transport_lib_id ?? undefined,
      mode: step.mode,
      fromPlace: step.from_place ?? undefined,
      toPlace: step.to_place ?? undefined,
    })),
    legacyActionTransportCount: links.data?.length ?? 0,
  });
}
