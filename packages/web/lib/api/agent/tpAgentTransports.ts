/**
 * Trip planning agent: transport operations
 */

import {
  ApiKeyAction,
  CreateTransportSchema,
  UpdateTransportSchema,
  localTimeToUtc,
  safeParseSchema,
  tpStepModeFromLibrary,
} from '@so/model';
import {agentErr, agentOk, agentValidation, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent, type AgentContext} from '@/lib/api/agent/loadAgentContext';
import {tpCall, ownedTpRow} from '@/lib/api/agent/tpAgentCall';
import {createDbTpTransportForAgent} from '@/lib/api/db/tp/createDbTpTransport';
import {updateDbTpTransportForAgent} from '@/lib/api/db/tp/updateDbTpTransport';
import {deleteDbTpTransportForAgent} from '@/lib/api/db/tp/deleteDbTpTransport';

async function stepModeForLibraryId(
  ctx: AgentContext,
  podId: string,
  transportLibId: string,
): Promise<AgentResult<string>> {
  const owned = await ownedTpRow(ctx, 'tp_transport_lib', transportLibId, podId);
  if (!owned.ok) {
    return owned;
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

export async function createAgentTpTransport(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const parsed = safeParseSchema(CreateTransportSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const {
    podId,
    routeId,
    mode,
    fromPlace,
    toPlace,
    departLocalTime,
    departTimezone,
    arriveLocalTime,
    arriveTimezone,
    costAmount,
    costCurrency,
    bookingRef,
    url,
    notes,
    sortOrder,
    durationMinutes,
    fromLocationId,
    toLocationId,
    transportLibId,
    done,
  } = parsed.value;

  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.CREATE));
  if (!ctx.ok) {
    return ctx;
  }

  const owned = await ownedTpRow(ctx.data, 'tp_route', routeId, podId);
  if (!owned.ok) {
    return owned;
  }

  let resolvedMode = mode ?? 'other';
  if (transportLibId !== undefined) {
    const libMode = await stepModeForLibraryId(ctx.data, podId, transportLibId);
    if (!libMode.ok) {
      return libMode;
    }
    resolvedMode = libMode.data;
  }

  let departAt: string | undefined;
  let arriveAt: string | undefined;

  if (typeof departLocalTime === 'string' && typeof departTimezone === 'string') {
    try {
      departAt = localTimeToUtc(departLocalTime, departTimezone);
    } catch (e: unknown) {
      const detail = e instanceof Error ? e.message : String(e);
      return agentErr(400, 'validation_error', `Invalid departure time: ${detail}`);
    }
  }

  if (typeof arriveLocalTime === 'string' && typeof arriveTimezone === 'string') {
    try {
      arriveAt = localTimeToUtc(arriveLocalTime, arriveTimezone);
    } catch (e: unknown) {
      const detail = e instanceof Error ? e.message : String(e);
      return agentErr(400, 'validation_error', `Invalid arrival time: ${detail}`);
    }
  }

  const result = await createDbTpTransportForAgent(ctx.data.supabase, {
    routeId,
    mode: resolvedMode,
    fromPlace,
    toPlace,
    departAt,
    arriveAt,
    departTimezone,
    arriveTimezone,
    costAmount,
    costCurrency,
    bookingRef,
    url,
    notes,
    sortOrder: sortOrder ?? 0,
    durationMinutes,
    fromLocationId,
    toLocationId,
    transportLibId,
    done,
  });

  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  if (result.data === null) {
    return agentErr(500, 'internal_error', 'Failed to create transport');
  }

  return agentOk(result.data);
}

export async function updateAgentTpTransport(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const parsed = safeParseSchema(UpdateTransportSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const args = parsed.value;
  const {podId, transportId} = args;

  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) {
    return ctx;
  }

  const owned = await ownedTpRow(ctx.data, 'tp_transport', transportId, podId);
  if (!owned.ok) {
    return owned;
  }

  const updates: Record<string, unknown> = {};
  if ('fromPlace' in args) {
    updates.from_place = args.fromPlace;
  }
  if ('toPlace' in args) {
    updates.to_place = args.toPlace;
  }
  if ('costAmount' in args) {
    updates.cost_amount = args.costAmount;
  }
  if ('costCurrency' in args) {
    updates.cost_currency = args.costCurrency;
  }
  if ('bookingRef' in args) {
    updates.booking_ref = args.bookingRef;
  }
  if ('url' in args) {
    updates.url = args.url;
  }
  if ('notes' in args) {
    updates.notes = args.notes;
  }
  if ('sortOrder' in args) {
    updates.sort_order = args.sortOrder;
  }
  if ('durationMinutes' in args) {
    updates.duration_minutes = args.durationMinutes;
  }
  if ('fromLocationId' in args) {
    updates.from_location_id = args.fromLocationId;
  }
  if ('toLocationId' in args) {
    updates.to_location_id = args.toLocationId;
  }
  if ('done' in args) {
    updates.done = args.done;
  }
  if ('transportLibId' in args) {
    updates.transport_lib_id = args.transportLibId;
    if (args.transportLibId !== undefined && args.transportLibId !== null) {
      const libMode = await stepModeForLibraryId(ctx.data, podId, args.transportLibId);
      if (!libMode.ok) {
        return libMode;
      }
      updates.mode = libMode.data;
    }
  } else if ('mode' in args && args.mode !== undefined) {
    updates.mode = args.mode;
  }

  if ('departLocalTime' in args && 'departTimezone' in args) {
    try {
      updates.depart_at = localTimeToUtc(String(args.departLocalTime), String(args.departTimezone));
      updates.depart_timezone = args.departTimezone;
    } catch (e: unknown) {
      const detail = e instanceof Error ? e.message : String(e);
      return agentErr(400, 'validation_error', `Invalid departure time: ${detail}`);
    }
  }

  if ('arriveLocalTime' in args && 'arriveTimezone' in args) {
    try {
      updates.arrive_at = localTimeToUtc(String(args.arriveLocalTime), String(args.arriveTimezone));
      updates.arrive_timezone = args.arriveTimezone;
    } catch (e: unknown) {
      const detail = e instanceof Error ? e.message : String(e);
      return agentErr(400, 'validation_error', `Invalid arrival time: ${detail}`);
    }
  }

  const result = await updateDbTpTransportForAgent(ctx.data.supabase, {transportId, ...updates});
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  if (result.data === null) {
    return agentErr(404, 'not_found', 'Transport not found');
  }

  return agentOk(result.data);
}

export async function deleteAgentTpTransport(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const transportId = typeof args.transportId === 'string' ? args.transportId : '';

  if (!podId || !transportId) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId and transportId are required'};
  }

  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.DELETE));
  if (!ctx.ok) {
    return ctx;
  }

  const owned = await ownedTpRow(ctx.data, 'tp_transport', transportId, podId);
  if (!owned.ok) {
    return owned;
  }

  const result = await deleteDbTpTransportForAgent(ctx.data.supabase, transportId);
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }

  return agentOk({ok: true});
}
