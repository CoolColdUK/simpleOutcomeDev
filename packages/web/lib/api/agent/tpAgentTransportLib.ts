import {
  ApiKeyAction,
  CreateTransportLibSchema,
  UpdateTransportLibSchema,
  safeParseSchema,
} from '@so/model';
import {agentErr, agentOk, agentValidation, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {mapAgentTpTransportLibRow} from '@/lib/api/agent/tpAgentResourceMaps';
import {tpCall, ownedTpRow, requireExistingTpTripId} from '@/lib/api/agent/tpAgentCall';
import {createDbTpTransportLibForAgent} from '@/lib/api/db/tp/createDbTpTransportLib';
import {updateDbTpTransportLibForAgent} from '@/lib/api/db/tp/updateDbTpTransportLib';
import {deleteDbTpTransportLibForAgent} from '@/lib/api/db/tp/deleteDbTpTransportLib';

function storedImportantReason(value: string | null | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export async function createAgentTpTransportLib(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const parsed = safeParseSchema(CreateTransportLibSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const {
    podId,
    label,
    mode,
    durationMinutes,
    costAmount,
    costCurrency,
    fromLocationId,
    toLocationId,
    notes,
    sortOrder,
    important,
    importantReason,
  } = parsed.value;
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.CREATE));
  if (!ctx.ok) {
    return ctx;
  }
  const tripId = await requireExistingTpTripId(ctx.data, podId);
  if (!tripId.ok) {
    return tripId;
  }
  const result = await createDbTpTransportLibForAgent(ctx.data.supabase, {
    tripId: tripId.data,
    label,
    mode: mode ?? null,
    durationMinutes,
    costAmount,
    costCurrency,
    fromLocationId,
    toLocationId,
    notes,
    important,
    importantReason: storedImportantReason(importantReason),
    sortOrder: sortOrder ?? 0,
  });
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  if (result.data === null) {
    return agentErr(500, 'internal_error', 'Failed to create transport');
  }
  return agentOk(mapAgentTpTransportLibRow(result.data));
}

export async function updateAgentTpTransportLib(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const parsed = safeParseSchema(UpdateTransportLibSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const {
    podId,
    transportLibId,
    label,
    mode,
    durationMinutes,
    costAmount,
    costCurrency,
    fromLocationId,
    toLocationId,
    notes,
    sortOrder,
    important,
    importantReason,
  } = parsed.value;
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) {
    return ctx;
  }
  const owned = await ownedTpRow(ctx.data, 'tp_transport_lib', transportLibId, podId);
  if (!owned.ok) {
    return owned;
  }
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const result = await updateDbTpTransportLibForAgent(ctx.data.supabase, transportLibId, {
    label,
    mode: 'mode' in args ? (mode ?? null) : undefined,
    durationMinutes: 'durationMinutes' in args ? durationMinutes ?? null : undefined,
    costAmount: 'costAmount' in args ? costAmount ?? null : undefined,
    costCurrency: 'costCurrency' in args ? (costCurrency ?? null) : undefined,
    fromLocationId: 'fromLocationId' in args ? (fromLocationId ?? null) : undefined,
    toLocationId: 'toLocationId' in args ? (toLocationId ?? null) : undefined,
    notes: 'notes' in args ? (notes ?? null) : undefined,
    important,
    importantReason: 'importantReason' in args ? storedImportantReason(importantReason) : undefined,
    sortOrder,
  });
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  if (result.data === null) {
    return agentErr(404, 'not_found', 'Transport not found');
  }
  return agentOk(mapAgentTpTransportLibRow(result.data));
}

export async function deleteAgentTpTransportLib(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const transportLibId = typeof args.transportLibId === 'string' ? args.transportLibId : '';
  if (!podId || !transportLibId) {
    return agentErr(400, 'validation_error', 'podId and transportLibId are required');
  }
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.DELETE));
  if (!ctx.ok) {
    return ctx;
  }
  const owned = await ownedTpRow(ctx.data, 'tp_transport_lib', transportLibId, podId);
  if (!owned.ok) {
    return owned;
  }
  const result = await deleteDbTpTransportLibForAgent(ctx.data.supabase, transportLibId);
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  return agentOk({ok: true});
}
