import {ApiKeyAction, CreateLocationSchema, UpdateLocationSchema, safeParseSchema} from '@so/model';
import {agentErr, agentOk, agentValidation, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {mapAgentTpLocationRow} from '@/lib/api/agent/tpAgentResourceMaps';
import {tpCall, ownedTpRow, requireExistingTpTripId} from '@/lib/api/agent/tpAgentCall';
import {createDbTpLocationForAgent} from '@/lib/api/db/tp/createDbTpLocation';
import {updateDbTpLocationForAgent} from '@/lib/api/db/tp/updateDbTpLocation';
import {deleteDbTpLocationForAgent} from '@/lib/api/db/tp/deleteDbTpLocation';

export async function createAgentTpLocation(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const parsed = safeParseSchema(CreateLocationSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const {
    podId,
    name,
    address,
    mapsUrl,
    notes,
    openTime,
    closeTime,
    website,
    email,
    phone,
    country,
    locationType,
    sortOrder,
  } = parsed.value;
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
    address,
    mapsUrl,
    notes,
    openTime,
    closeTime,
    website,
    email,
    phone,
    country: country !== undefined && country !== '' ? country.toUpperCase() : country,
    locationType: locationType ?? 'other',
    sortOrder: sortOrder ?? 0,
  });
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  if (result.data === null) {
    return agentErr(500, 'internal_error', 'Failed to create location');
  }
  return agentOk(mapAgentTpLocationRow(result.data));
}

export async function updateAgentTpLocation(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const parsed = safeParseSchema(UpdateLocationSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const {podId, locationId, name, address, mapsUrl, notes, openTime, closeTime, website, email, phone, country, locationType, sortOrder} =
    parsed.value;
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) {
    return ctx;
  }
  const owned = await ownedTpRow(ctx.data, 'tp_location', locationId, podId);
  if (!owned.ok) {
    return owned;
  }
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const result = await updateDbTpLocationForAgent(ctx.data.supabase, locationId, {
    name,
    address: 'address' in args ? (address ?? null) : undefined,
    mapsUrl: 'mapsUrl' in args ? (mapsUrl ?? null) : undefined,
    notes: 'notes' in args ? (notes ?? null) : undefined,
    openTime: 'openTime' in args ? (openTime ?? null) : undefined,
    closeTime: 'closeTime' in args ? (closeTime ?? null) : undefined,
    website: 'website' in args ? (website ?? null) : undefined,
    email: 'email' in args ? (email ?? null) : undefined,
    phone: 'phone' in args ? (phone ?? null) : undefined,
    country:
      'country' in args
        ? country === null || country === undefined || country === ''
          ? null
          : country.toUpperCase()
        : undefined,
    locationType,
    sortOrder,
  });
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  if (result.data === null) {
    return agentErr(404, 'not_found', 'Location not found');
  }
  return agentOk(mapAgentTpLocationRow(result.data));
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
