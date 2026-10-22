/**
 * Trip planning agent: transport operations
 */

import {ApiKeyAction} from '@so/model';
import {agentErr, agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {tpCall, ownedTpRow} from '@/lib/api/agent/tpAgentCall';
import {createDbTpTransport} from '@/lib/api/db/tp/createDbTpTransport';
import {updateDbTpTransport} from '@/lib/api/db/tp/updateDbTpTransport';
import {deleteDbTpTransport} from '@/lib/api/db/tp/deleteDbTpTransport';
import {localTimeToUtc} from '@so/model';

export async function createAgentTpTransport(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const routeId = typeof args.routeId === 'string' ? args.routeId : '';
  
  if (!podId || !routeId) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId and routeId are required'};
  }
  
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.CREATE));
  if (!ctx.ok) return ctx;
  
  // Verify route ownership
  const owned = await ownedTpRow(ctx.data, 'tp_route', routeId, podId);
  if (!owned.ok) return owned;
  
  // Convert local times to UTC
  let departAt: string | undefined;
  let arriveAt: string | undefined;
  
  if (typeof args.departLocalTime === 'string' && typeof args.departTimezone === 'string') {
    try {
      departAt = localTimeToUtc(args.departLocalTime, args.departTimezone);
    } catch (e) {
      return agentErr(400, 'validation_error', `Invalid departure time: ${e.message}`);
    }
  }
  
  if (typeof args.arriveLocalTime === 'string' && typeof args.arriveTimezone === 'string') {
    try {
      arriveAt = localTimeToUtc(args.arriveLocalTime, args.arriveTimezone);
    } catch (e) {
      return agentErr(400, 'validation_error', `Invalid arrival time: ${e.message}`);
    }
  }
  
  const result = await createDbTpTransport(ctx.data.supabase, {
    routeId,
    mode: typeof args.mode === 'string' ? args.mode : 'other',
    fromPlace: typeof args.fromPlace === 'string' ? args.fromPlace : undefined,
    toPlace: typeof args.toPlace === 'string' ? args.toPlace : undefined,
    departAt,
    arriveAt,
    departTimezone: typeof args.departTimezone === 'string' ? args.departTimezone : undefined,
    arriveTimezone: typeof args.arriveTimezone === 'string' ? args.arriveTimezone : undefined,
    costAmount: typeof args.costAmount === 'number' ? args.costAmount : undefined,
    costCurrency: typeof args.costCurrency === 'string' ? args.costCurrency : undefined,
    bookingRef: typeof args.bookingRef === 'string' ? args.bookingRef : undefined,
    url: typeof args.url === 'string' ? args.url : undefined,
    notes: typeof args.notes === 'string' ? args.notes : undefined,
    sortOrder: typeof args.sortOrder === 'number' ? args.sortOrder : 0,
  });
  
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  if (result.data === null) return agentErr(500, 'internal_error', 'Failed to create transport');
  
  return agentOk(result.data);
}

export async function updateAgentTpTransport(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const transportId = typeof args.transportId === 'string' ? args.transportId : '';
  
  if (!podId || !transportId) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId and transportId are required'};
  }
  
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) return ctx;
  
  // Verify ownership
  const owned = await ownedTpRow(ctx.data, 'tp_transport', transportId, podId);
  if (!owned.ok) return owned;
  
  const updates: Record<string, unknown> = {};
  if ('mode' in args) updates.mode = args.mode;
  if ('fromPlace' in args) updates.from_place = args.fromPlace;
  if ('toPlace' in args) updates.to_place = args.toPlace;
  if ('costAmount' in args) updates.cost_amount = args.costAmount;
  if ('costCurrency' in args) updates.cost_currency = args.costCurrency;
  if ('bookingRef' in args) updates.booking_ref = args.bookingRef;
  if ('url' in args) updates.url = args.url;
  if ('notes' in args) updates.notes = args.notes;
  if ('sortOrder' in args) updates.sort_order = args.sortOrder;
  
  // Handle timezone conversions
  if ('departLocalTime' in args && 'departTimezone' in args) {
    try {
      updates.depart_at = localTimeToUtc(String(args.departLocalTime), String(args.departTimezone));
      updates.depart_timezone = args.departTimezone;
    } catch (e) {
      return agentErr(400, 'validation_error', `Invalid departure time: ${e.message}`);
    }
  }
  
  if ('arriveLocalTime' in args && 'arriveTimezone' in args) {
    try {
      updates.arrive_at = localTimeToUtc(String(args.arriveLocalTime), String(args.arriveTimezone));
      updates.arrive_timezone = args.arriveTimezone;
    } catch (e) {
      return agentErr(400, 'validation_error', `Invalid arrival time: ${e.message}`);
    }
  }
  
  const result = await updateDbTpTransport(ctx.data.supabase, {transportId, ...updates} as any);
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  if (result.data === null) return agentErr(404, 'not_found', 'Transport not found');
  
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
  if (!ctx.ok) return ctx;
  
  // Verify ownership
  const owned = await ownedTpRow(ctx.data, 'tp_transport', transportId, podId);
  if (!owned.ok) return owned;
  
  const result = await deleteDbTpTransport(ctx.data.supabase, transportId);
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  
  return agentOk({ok: true});
}
