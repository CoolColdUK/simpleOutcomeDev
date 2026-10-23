import {ApiKeyAction} from '@so/model';
import {agentErr, agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {tpCall, ownedTpRow, requireExistingTpTripId} from '@/lib/api/agent/tpAgentCall';
import {createDbTpLocationForAgent} from '@/lib/api/db/tp/createDbTpLocation';
import {updateDbTpLocationForAgent} from '@/lib/api/db/tp/updateDbTpLocation';
import {deleteDbTpLocationForAgent} from '@/lib/api/db/tp/deleteDbTpLocation';

export async function createAgentTpLocation(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const name = typeof args.name === 'string' ? args.name : '';
  if (!podId || !name) {
    return agentErr(400, 'validation_error', 'podId and name are required');
  }
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.CREATE));
  if (!ctx.ok) {
    return ctx;
  }
  const tripId = await requireExistingTpTripId(ctx.data, podId);
  if (!tripId.ok) {
    return tripId;
  }
  const result = await createDbTpLocationForAgent(ctx.data.supabase, {
    tripId: tripId.data,
    name,
    address: typeof args.address === 'string' ? args.address : undefined,
    mapsUrl: typeof args.mapsUrl === 'string' ? args.mapsUrl : undefined,
    notes: typeof args.notes === 'string' ? args.notes : undefined,
    openTime: typeof args.openTime === 'string' ? args.openTime : undefined,
    closeTime: typeof args.closeTime === 'string' ? args.closeTime : undefined,
    website: typeof args.website === 'string' ? args.website : undefined,
    email: typeof args.email === 'string' ? args.email : undefined,
    phone: typeof args.phone === 'string' ? args.phone : undefined,
    sortOrder: typeof args.sortOrder === 'number' ? args.sortOrder : 0,
  });
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  if (result.data === null) {
    return agentErr(500, 'internal_error', 'Failed to create location');
  }
  return agentOk(result.data);
}

export async function updateAgentTpLocation(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const locationId = typeof args.locationId === 'string' ? args.locationId : '';
  if (!podId || !locationId) {
    return agentErr(400, 'validation_error', 'podId and locationId are required');
  }
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) {
    return ctx;
  }
  const owned = await ownedTpRow(ctx.data, 'tp_location', locationId, podId);
  if (!owned.ok) {
    return owned;
  }
  const result = await updateDbTpLocationForAgent(ctx.data.supabase, locationId, {
    name: typeof args.name === 'string' ? args.name : undefined,
    address: 'address' in args ? (typeof args.address === 'string' ? args.address : null) : undefined,
    mapsUrl: 'mapsUrl' in args ? (typeof args.mapsUrl === 'string' ? args.mapsUrl : null) : undefined,
    notes: 'notes' in args ? (typeof args.notes === 'string' ? args.notes : null) : undefined,
    openTime: 'openTime' in args ? (typeof args.openTime === 'string' ? args.openTime : null) : undefined,
    closeTime: 'closeTime' in args ? (typeof args.closeTime === 'string' ? args.closeTime : null) : undefined,
    website: 'website' in args ? (typeof args.website === 'string' ? args.website : null) : undefined,
    email: 'email' in args ? (typeof args.email === 'string' ? args.email : null) : undefined,
    phone: 'phone' in args ? (typeof args.phone === 'string' ? args.phone : null) : undefined,
    sortOrder: typeof args.sortOrder === 'number' ? args.sortOrder : undefined,
  });
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  if (result.data === null) {
    return agentErr(404, 'not_found', 'Location not found');
  }
  return agentOk(result.data);
}

export async function deleteAgentTpLocation(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const locationId = typeof args.locationId === 'string' ? args.locationId : '';
  if (!podId || !locationId) {
    return agentErr(400, 'validation_error', 'podId and locationId are required');
  }
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.DELETE));
  if (!ctx.ok) {
    return ctx;
  }
  const owned = await ownedTpRow(ctx.data, 'tp_location', locationId, podId);
  if (!owned.ok) {
    return owned;
  }
  const result = await deleteDbTpLocationForAgent(ctx.data.supabase, locationId);
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  return agentOk({ok: true});
}
