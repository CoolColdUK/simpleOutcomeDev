/**
 * Trip planning agent: action operations
 */

import {ApiKeyAction} from '@so/model';
import {agentErr, agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {tpCall, ownedTpRow} from '@/lib/api/agent/tpAgentCall';
import {createDbTpAction} from '@/lib/api/db/tp/createDbTpAction';
import {updateDbTpAction} from '@/lib/api/db/tp/updateDbTpAction';
import deleteDbTpAction from '@/lib/api/db/tp/deleteDbTpAction';
import {localTimeToUtc} from '@so/model';

export async function createAgentTpAction(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const kind = typeof args.kind === 'string' ? args.kind : '';
  const title = typeof args.title === 'string' ? args.title : '';
  
  if (!podId || !kind || !title) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId, kind, and title are required'};
  }
  
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.CREATE));
  if (!ctx.ok) return ctx;
  
  // Get trip ID
  const trip = await ctx.data.supabase.from('tp_trip').select('id').eq('pod_id', podId).single();
  const tripErr = dbErr(trip.error);
  if (tripErr !== undefined) return tripErr;
  if (trip.data === null) return agentErr(404, 'not_found', 'Trip not found');
  
  // Convert local times to UTC for check-in/check-out
  let checkInAt: string | undefined;
  let checkOutAt: string | undefined;
  
  if (kind === 'stay') {
    if (typeof args.checkInLocalTime === 'string' && typeof args.checkInTimezone === 'string') {
      try {
        checkInAt = localTimeToUtc(args.checkInLocalTime, args.checkInTimezone);
      } catch (e) {
        return agentErr(400, 'validation_error', `Invalid check-in time: ${e.message}`);
      }
    }
    if (typeof args.checkOutLocalTime === 'string' && typeof args.checkOutTimezone === 'string') {
      try {
        checkOutAt = localTimeToUtc(args.checkOutLocalTime, args.checkOutTimezone);
      } catch (e) {
        return agentErr(400, 'validation_error', `Invalid check-out time: ${e.message}`);
      }
    }
  }
  
  const result = await createDbTpAction(ctx.data.supabase, {
    tripId: trip.data.id,
    kind,
    title,
    anchorDayId: typeof args.anchorDayId === 'string' ? args.anchorDayId : undefined,
    destinationId: typeof args.destinationId === 'string' ? args.destinationId : undefined,
    placeText: typeof args.placeText === 'string' ? args.placeText : undefined,
    mapsUrl: typeof args.mapsUrl === 'string' ? args.mapsUrl : undefined,
    fromPlace: typeof args.fromPlace === 'string' ? args.fromPlace : undefined,
    toPlace: typeof args.toPlace === 'string' ? args.toPlace : undefined,
    fromDestinationId: typeof args.fromDestinationId === 'string' ? args.fromDestinationId : undefined,
    toDestinationId: typeof args.toDestinationId === 'string' ? args.toDestinationId : undefined,
    fromMapsUrl: typeof args.fromMapsUrl === 'string' ? args.fromMapsUrl : undefined,
    toMapsUrl: typeof args.toMapsUrl === 'string' ? args.toMapsUrl : undefined,
    checkInAt,
    checkOutAt,
    checkInTimezone: typeof args.checkInTimezone === 'string' ? args.checkInTimezone : undefined,
    checkOutTimezone: typeof args.checkOutTimezone === 'string' ? args.checkOutTimezone : undefined,
    startTime: typeof args.startTime === 'string' ? args.startTime : undefined,
    endTime: typeof args.endTime === 'string' ? args.endTime : undefined,
    costAmount: typeof args.costAmount === 'number' ? args.costAmount : undefined,
    costCurrency: typeof args.costCurrency === 'string' ? args.costCurrency : undefined,
    bookingRef: typeof args.bookingRef === 'string' ? args.bookingRef : undefined,
    url: typeof args.url === 'string' ? args.url : undefined,
    notes: typeof args.notes === 'string' ? args.notes : undefined,
    sortOrder: typeof args.sortOrder === 'number' ? args.sortOrder : 0,
  });
  
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  if (result.data === null) return agentErr(500, 'internal_error', 'Failed to create action');
  
  return agentOk(result.data);
}

export async function updateAgentTpAction(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const actionId = typeof args.actionId === 'string' ? args.actionId : '';
  
  if (!podId || !actionId) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId and actionId are required'};
  }
  
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) return ctx;
  
  // Verify ownership
  const owned = await ownedTpRow(ctx.data, 'tp_action', actionId, podId);
  if (!owned.ok) return owned;
  
  const updates: Record<string, unknown> = {};
  if ('title' in args) updates.title = args.title;
  if ('anchorDayId' in args) updates.anchor_day_id = args.anchorDayId;
  if ('destinationId' in args) updates.destination_id = args.destinationId;
  if ('placeText' in args) updates.place_text = args.placeText;
  if ('mapsUrl' in args) updates.maps_url = args.mapsUrl;
  if ('fromPlace' in args) updates.from_place = args.fromPlace;
  if ('toPlace' in args) updates.to_place = args.toPlace;
  if ('fromDestinationId' in args) updates.from_destination_id = args.fromDestinationId;
  if ('toDestinationId' in args) updates.to_destination_id = args.toDestinationId;
  if ('fromMapsUrl' in args) updates.from_maps_url = args.fromMapsUrl;
  if ('toMapsUrl' in args) updates.to_maps_url = args.toMapsUrl;
  if ('startTime' in args) updates.start_time = args.startTime;
  if ('endTime' in args) updates.end_time = args.endTime;
  if ('costAmount' in args) updates.cost_amount = args.costAmount;
  if ('costCurrency' in args) updates.cost_currency = args.costCurrency;
  if ('bookingRef' in args) updates.booking_ref = args.bookingRef;
  if ('url' in args) updates.url = args.url;
  if ('notes' in args) updates.notes = args.notes;
  if ('selectedRouteId' in args) updates.selected_route_id = args.selectedRouteId;
  if ('sortOrder' in args) updates.sort_order = args.sortOrder;
  
  // Handle timezone conversions for check-in/check-out
  if ('checkInLocalTime' in args && 'checkInTimezone' in args) {
    try {
      updates.check_in_at = localTimeToUtc(String(args.checkInLocalTime), String(args.checkInTimezone));
      updates.check_in_timezone = args.checkInTimezone;
    } catch (e) {
      return agentErr(400, 'validation_error', `Invalid check-in time: ${e.message}`);
    }
  }
  if ('checkOutLocalTime' in args && 'checkOutTimezone' in args) {
    try {
      updates.check_out_at = localTimeToUtc(String(args.checkOutLocalTime), String(args.checkOutTimezone));
      updates.check_out_timezone = args.checkOutTimezone;
    } catch (e) {
      return agentErr(400, 'validation_error', `Invalid check-out time: ${e.message}`);
    }
  }
  
  const result = await updateDbTpAction(ctx.data.supabase, {actionId, ...updates} as any);
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  if (result.data === null) return agentErr(404, 'not_found', 'Action not found');
  
  return agentOk(result.data);
}

export async function deleteAgentTpAction(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const actionId = typeof args.actionId === 'string' ? args.actionId : '';
  
  if (!podId || !actionId) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId and actionId are required'};
  }
  
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.DELETE));
  if (!ctx.ok) return ctx;
  
  // Verify ownership
  const owned = await ownedTpRow(ctx.data, 'tp_action', actionId, podId);
  if (!owned.ok) return owned;
  
  const result = await deleteDbTpAction(ctx.data.supabase, actionId);
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  
  return agentOk({ok: true});
}
