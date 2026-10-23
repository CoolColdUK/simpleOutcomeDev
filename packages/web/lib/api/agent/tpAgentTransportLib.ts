import {ApiKeyAction} from '@so/model';
import {agentErr, agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {tpCall, ownedTpRow, requireExistingTpTripId} from '@/lib/api/agent/tpAgentCall';
import {createDbTpTransportLibForAgent} from '@/lib/api/db/tp/createDbTpTransportLib';
import {updateDbTpTransportLibForAgent} from '@/lib/api/db/tp/updateDbTpTransportLib';
import {deleteDbTpTransportLibForAgent} from '@/lib/api/db/tp/deleteDbTpTransportLib';

export async function createAgentTpTransportLib(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const label = typeof args.label === 'string' ? args.label : '';
  if (!podId || !label) {
    return agentErr(400, 'validation_error', 'podId and label are required');
  }
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
    mode: 'mode' in args ? (typeof args.mode === 'string' ? args.mode : null) : undefined,
    durationMinutes: typeof args.durationMinutes === 'number' ? args.durationMinutes : undefined,
    costAmount: typeof args.costAmount === 'number' ? args.costAmount : undefined,
    costCurrency: typeof args.costCurrency === 'string' ? args.costCurrency : undefined,
    fromLocationId: typeof args.fromLocationId === 'string' ? args.fromLocationId : undefined,
    toLocationId: typeof args.toLocationId === 'string' ? args.toLocationId : undefined,
    notes: typeof args.notes === 'string' ? args.notes : undefined,
    sortOrder: typeof args.sortOrder === 'number' ? args.sortOrder : 0,
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

export async function updateAgentTpTransportLib(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const transportLibId = typeof args.transportLibId === 'string' ? args.transportLibId : '';
  if (!podId || !transportLibId) {
    return agentErr(400, 'validation_error', 'podId and transportLibId are required');
  }
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) {
    return ctx;
  }
  const owned = await ownedTpRow(ctx.data, 'tp_transport_lib', transportLibId, podId);
  if (!owned.ok) {
    return owned;
  }
  const result = await updateDbTpTransportLibForAgent(ctx.data.supabase, transportLibId, {
    label: typeof args.label === 'string' ? args.label : undefined,
    mode: 'mode' in args ? (typeof args.mode === 'string' ? args.mode : null) : undefined,
    durationMinutes: typeof args.durationMinutes === 'number' ? args.durationMinutes : args.durationMinutes === null ? null : undefined,
    costAmount: typeof args.costAmount === 'number' ? args.costAmount : args.costAmount === null ? null : undefined,
    costCurrency: 'costCurrency' in args ? (typeof args.costCurrency === 'string' ? args.costCurrency : null) : undefined,
    fromLocationId: 'fromLocationId' in args ? (typeof args.fromLocationId === 'string' ? args.fromLocationId : null) : undefined,
    toLocationId: 'toLocationId' in args ? (typeof args.toLocationId === 'string' ? args.toLocationId : null) : undefined,
    notes: 'notes' in args ? (typeof args.notes === 'string' ? args.notes : null) : undefined,
    sortOrder: typeof args.sortOrder === 'number' ? args.sortOrder : undefined,
  });
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  if (result.data === null) {
    return agentErr(404, 'not_found', 'Transport not found');
  }
  return agentOk(result.data);
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
