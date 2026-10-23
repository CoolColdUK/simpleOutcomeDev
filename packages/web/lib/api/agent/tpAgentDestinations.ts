/**
 * Trip planning agent: destination operations
 */

import {ApiKeyAction} from '@so/model';
import {agentErr, agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {tpCall, ownedTpRow, requireExistingTpTripId} from '@/lib/api/agent/tpAgentCall';
import createDbTpDestination from '@/lib/api/db/tp/createDbTpDestination';
import {updateDbTpDestinationForAgent} from '@/lib/api/db/tp/updateDbTpDestination';
import deleteDbTpDestination from '@/lib/api/db/tp/deleteDbTpDestination';

export async function createAgentTpDestination(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const name = typeof args.name === 'string' ? args.name : '';
  
  if (!podId || !name) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId and name are required'};
  }
  
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.CREATE));
  if (!ctx.ok) return ctx;
  
  const tripId = await requireExistingTpTripId(ctx.data, podId);
  if (!tripId.ok) return tripId;

  const result = await createDbTpDestination(ctx.data.supabase, {
    tripId: tripId.data,
    name,
    sortOrder: typeof args.sortOrder === 'number' ? args.sortOrder : 0,
    mapsUrl: typeof args.mapsUrl === 'string' ? args.mapsUrl : undefined,
    timezoneHint: typeof args.timezoneHint === 'string' ? args.timezoneHint : undefined,
    importantInfo: typeof args.importantInfo === 'string' ? args.importantInfo : undefined,
    activeStartDate: typeof args.activeStartDate === 'string' ? args.activeStartDate : undefined,
    activeEndDate: typeof args.activeEndDate === 'string' ? args.activeEndDate : undefined,
    notes: typeof args.notes === 'string' ? args.notes : undefined,
  });
  
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  if (result.data === null) return agentErr(500, 'internal_error', 'Failed to create destination');
  
  return agentOk(result.data);
}

export async function updateAgentTpDestination(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const destinationId = typeof args.destinationId === 'string' ? args.destinationId : '';
  
  if (!podId || !destinationId) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId and destinationId are required'};
  }
  
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) return ctx;
  
  // Verify ownership
  const owned = await ownedTpRow(ctx.data, 'tp_destination', destinationId, podId);
  if (!owned.ok) return owned;
  
  const updates: Record<string, unknown> = {};
  if ('name' in args) updates.name = args.name;
  if ('sortOrder' in args) updates.sort_order = args.sortOrder;
  if ('mapsUrl' in args) updates.maps_url = args.mapsUrl;
  if ('timezoneHint' in args) updates.timezone_hint = args.timezoneHint;
  if ('importantInfo' in args) updates.important_info = args.importantInfo;
  if ('activeStartDate' in args) updates.active_start_date = args.activeStartDate;
  if ('activeEndDate' in args) updates.active_end_date = args.activeEndDate;
  if ('notes' in args) updates.notes = args.notes;
  
  const result = await updateDbTpDestinationForAgent(ctx.data.supabase, destinationId, updates);
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  if (result.data === null) return agentErr(404, 'not_found', 'Destination not found');
  
  return agentOk(result.data);
}

export async function deleteAgentTpDestination(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const destinationId = typeof args.destinationId === 'string' ? args.destinationId : '';
  
  if (!podId || !destinationId) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId and destinationId are required'};
  }
  
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.DELETE));
  if (!ctx.ok) return ctx;
  
  // Verify ownership
  const owned = await ownedTpRow(ctx.data, 'tp_destination', destinationId, podId);
  if (!owned.ok) return owned;
  
  const result = await deleteDbTpDestination(ctx.data.supabase, destinationId);
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  
  return agentOk({ok: true});
}
