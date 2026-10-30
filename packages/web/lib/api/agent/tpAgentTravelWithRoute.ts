import type {SupabaseClient} from '@supabase/supabase-js';
import {
  ApiKeyAction,
  CreateTpTravelWithRouteSchema,
  localTimeToUtc,
  safeParseSchema,
  tpStepModeFromLibrary,
} from '@so/model';
import {agentErr, agentOk, agentValidation, dbErr, type AgentErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent, type AgentContext} from '@/lib/api/agent/loadAgentContext';
import {withTpTravelWarnings} from '@/lib/api/agent/attachTpTravelWarnings';
import {tpCall, ownedTpRow, requireExistingTpTripId} from '@/lib/api/agent/tpAgentCall';
import {
  mapAgentTpActionRow,
  mapAgentTpRouteRow,
  mapAgentTpTransportRow,
} from '@/lib/api/agent/tpAgentResourceMaps';
import {createDbTpActionForAgent} from '@/lib/api/db/tp/createDbTpAction';
import deleteDbTpAction from '@/lib/api/db/tp/deleteDbTpAction';
import {createDbTpRouteForAgent} from '@/lib/api/db/tp/createDbTpRoute';
import {updateDbTpRouteForAgent} from '@/lib/api/db/tp/updateDbTpRoute';
import {selectDbTpRouteForAgent} from '@/lib/api/db/tp/selectDbTpRoute';
import {createDbTpTransportForAgent} from '@/lib/api/db/tp/createDbTpTransport';
import type {Database} from '@/lib/supabase/database';

type Db = SupabaseClient<Database>;

async function rollbackTravel(supabase: Db, actionId: string): Promise<void> {
  const cleared = await supabase.from('tp_action').update({selected_route_id: null}).eq('id', actionId);
  if (cleared.error !== null) {
    console.error('create_tp_travel_with_route rollback clear', cleared.error);
  }
  const deleted = await deleteDbTpAction(supabase, actionId);
  if (deleted.error !== null) {
    console.error('create_tp_travel_with_route rollback delete', deleted.error);
  }
}

async function failTravel(supabase: Db, actionId: string, err: AgentErr): Promise<AgentErr> {
  await rollbackTravel(supabase, actionId);
  return err;
}

async function requireId(
  ctx: AgentContext,
  table: 'tp_day' | 'tp_destination' | 'tp_location' | 'tp_transport_lib',
  id: string | undefined,
  podId: string,
): Promise<AgentErr | undefined> {
  if (id === undefined) {
    return undefined;
  }
  const owned = await ownedTpRow(ctx, table, id, podId);
  return owned.ok ? undefined : owned;
}

function utcPair(
  localTime: string | undefined,
  timezone: string | undefined,
  label: string,
): AgentResult<string | undefined> {
  if (localTime === undefined || timezone === undefined) {
    return agentOk(undefined);
  }
  try {
    return agentOk(localTimeToUtc(localTime, timezone));
  } catch (e: unknown) {
    const detail = e instanceof Error ? e.message : String(e);
    return agentErr(400, 'validation_error', `Invalid ${label}: ${detail}`);
  }
}

export async function createAgentTpTravelWithRoute(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const parsed = safeParseSchema(CreateTpTravelWithRouteSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const value = parsed.value;
  const ctx = await requirePodAgent(request, tpCall(value.podId, ApiKeyAction.CREATE));
  if (!ctx.ok) {
    return ctx;
  }
  const tripId = await requireExistingTpTripId(ctx.data, value.podId);
  if (!tripId.ok) {
    return tripId;
  }
  const checks = await Promise.all([
    requireId(ctx.data, 'tp_day', value.anchorDayId, value.podId),
    requireId(ctx.data, 'tp_destination', value.fromDestinationId, value.podId),
    requireId(ctx.data, 'tp_destination', value.toDestinationId, value.podId),
    requireId(ctx.data, 'tp_location', value.fromLocationId, value.podId),
    requireId(ctx.data, 'tp_location', value.toLocationId, value.podId),
    requireId(ctx.data, 'tp_transport_lib', value.route.transportLibId, value.podId),
    requireId(ctx.data, 'tp_transport_lib', value.initialStep?.transportLibId, value.podId),
    requireId(ctx.data, 'tp_location', value.initialStep?.fromLocationId, value.podId),
    requireId(ctx.data, 'tp_location', value.initialStep?.toLocationId, value.podId),
  ]);
  const failedCheck = checks.find((item) => item !== undefined);
  if (failedCheck !== undefined) {
    return failedCheck;
  }
  const departAt = utcPair(value.initialStep?.departLocalTime, value.initialStep?.departTimezone, 'departure time');
  if (!departAt.ok) {
    return departAt;
  }
  const arriveAt = utcPair(value.initialStep?.arriveLocalTime, value.initialStep?.arriveTimezone, 'arrival time');
  if (!arriveAt.ok) {
    return arriveAt;
  }
  const stepMode = await resolveStepMode(ctx.data, value.initialStep?.transportLibId, value.initialStep?.mode);
  if (!stepMode.ok) {
    return stepMode;
  }

  const created = await createDbTpActionForAgent(ctx.data.supabase, {
    tripId: tripId.data,
    kind: 'travel',
    title: value.title,
    anchorDayId: value.anchorDayId,
    fromPlace: value.fromPlace,
    toPlace: value.toPlace,
    fromDestinationId: value.fromDestinationId,
    toDestinationId: value.toDestinationId,
    fromMapsUrl: value.fromMapsUrl,
    toMapsUrl: value.toMapsUrl,
    fromLocationId: value.fromLocationId,
    toLocationId: value.toLocationId,
    costAmount: value.costAmount,
    costCurrency: value.costCurrency,
    bookingRef: value.bookingRef,
    url: value.url,
    notes: value.notes,
    sortOrder: value.sortOrder ?? 0,
    done: value.done,
  });
  const createdErr = dbErr(created.error);
  if (createdErr !== undefined) {
    return createdErr;
  }
  if (created.data === null) {
    return agentErr(500, 'internal_error', 'Failed to create travel action');
  }
  const actionId = created.data.id;
  const supabase = ctx.data.supabase;

  const route = await createDbTpRouteForAgent(supabase, {
    actionId,
    name: value.route.name,
    notes: value.route.notes,
    sortOrder: value.route.sortOrder ?? 0,
  });
  const routeErr = dbErr(route.error);
  if (routeErr !== undefined || route.data === null) {
    return failTravel(supabase, actionId, routeErr ?? agentErr(500, 'internal_error', 'Failed to create route'));
  }
  const routeId = route.data.id;
  const extras = await applyRouteExtras(supabase, routeId, value.route);
  if (!extras.ok) {
    return failTravel(supabase, actionId, extras);
  }

  const transportId = await insertInitialStep(supabase, routeId, value.initialStep, stepMode.data, departAt.data, arriveAt.data);
  if (!transportId.ok) {
    return failTravel(supabase, actionId, transportId);
  }

  const selectRoute = value.selectRoute !== false;
  if (selectRoute) {
    const selected = await selectDbTpRouteForAgent(supabase, {actionId, routeId});
    const selectedErr = dbErr(selected.error);
    if (selectedErr !== undefined) {
      return failTravel(supabase, actionId, selectedErr);
    }
  }

  const loaded = await loadCreatedRows(supabase, actionId, routeId, transportId.data);
  if (!loaded.ok) {
    return failTravel(supabase, actionId, loaded);
  }
  return agentOk(
    await withTpTravelWarnings(supabase, actionId, {
      action: mapAgentTpActionRow(loaded.data.action),
      route: mapAgentTpRouteRow(loaded.data.route),
      ...(loaded.data.transport === undefined ? {} : {transport: mapAgentTpTransportRow(loaded.data.transport)}),
      selectedRoute: selectRoute,
    }),
  );
}

async function resolveStepMode(
  ctx: AgentContext,
  transportLibId: string | undefined,
  mode: string | undefined,
): Promise<AgentResult<string>> {
  if (transportLibId === undefined) {
    return agentOk(mode ?? 'other');
  }
  const lib = await ctx.supabase.from('tp_transport_lib').select('mode').eq('id', transportLibId).maybeSingle();
  const libErr = dbErr(lib.error);
  if (libErr !== undefined) {
    return libErr;
  }
  if (lib.data === null) {
    return agentErr(404, 'not_found', 'Transport library row not found');
  }
  return agentOk(tpStepModeFromLibrary(lib.data.mode));
}

async function applyRouteExtras(
  supabase: Db,
  routeId: string,
  route: {
    readonly costAmount?: number;
    readonly costCurrency?: string;
    readonly durationMinutes?: number;
    readonly transportLibId?: string;
  },
): Promise<AgentResult<true>> {
  if (
    route.costAmount === undefined &&
    route.costCurrency === undefined &&
    route.durationMinutes === undefined &&
    route.transportLibId === undefined
  ) {
    return agentOk(true);
  }
  const updated = await updateDbTpRouteForAgent(supabase, routeId, {
    costAmount: route.costAmount,
    costCurrency: route.costCurrency,
    durationMinutes: route.durationMinutes,
    transportLibId: route.transportLibId,
  });
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  if (updated.data === null) {
    return agentErr(500, 'internal_error', 'Failed to update route');
  }
  return agentOk(true);
}

async function insertInitialStep(
  supabase: Db,
  routeId: string,
  step:
    | {
        readonly transportLibId?: string;
        readonly fromPlace?: string;
        readonly toPlace?: string;
        readonly fromLocationId?: string;
        readonly toLocationId?: string;
        readonly departTimezone?: string;
        readonly arriveTimezone?: string;
        readonly costAmount?: number;
        readonly costCurrency?: string;
        readonly bookingRef?: string;
        readonly url?: string;
        readonly notes?: string;
        readonly sortOrder?: number;
      }
    | undefined,
  mode: string,
  departAt: string | undefined,
  arriveAt: string | undefined,
): Promise<AgentResult<string | undefined>> {
  if (step === undefined) {
    return agentOk(undefined);
  }
  const created = await createDbTpTransportForAgent(supabase, {
    routeId,
    mode,
    fromPlace: step.fromPlace,
    toPlace: step.toPlace,
    departAt,
    arriveAt,
    departTimezone: step.departTimezone,
    arriveTimezone: step.arriveTimezone,
    costAmount: step.costAmount,
    costCurrency: step.costCurrency,
    bookingRef: step.bookingRef,
    url: step.url,
    notes: step.notes,
    sortOrder: step.sortOrder ?? 0,
    fromLocationId: step.fromLocationId,
    toLocationId: step.toLocationId,
    transportLibId: step.transportLibId,
  });
  const createdErr = dbErr(created.error);
  if (createdErr !== undefined) {
    return createdErr;
  }
  if (created.data === null) {
    return agentErr(500, 'internal_error', 'Failed to create transport');
  }
  return agentOk(created.data.id);
}

async function loadCreatedRows(supabase: Db, actionId: string, routeId: string, transportId: string | undefined) {
  const [action, route, transport] = await Promise.all([
    supabase.from('tp_action').select('*').eq('id', actionId).single(),
    supabase.from('tp_route').select('*').eq('id', routeId).single(),
    transportId === undefined
      ? Promise.resolve({data: null, error: null})
      : supabase.from('tp_transport').select('*').eq('id', transportId).single(),
  ]);
  const err = dbErr(action.error) ?? dbErr(route.error) ?? dbErr(transport.error);
  if (err !== undefined) {
    return err;
  }
  if (action.data === null || route.data === null || (transportId !== undefined && transport.data === null)) {
    return agentErr(500, 'internal_error', 'Failed to load created travel');
  }
  return agentOk({
    action: action.data,
    route: route.data,
    transport: transport.data === null ? undefined : transport.data,
  });
}
