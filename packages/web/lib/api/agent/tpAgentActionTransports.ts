import {ApiKeyAction, LinkActionTransportSchema, UpdateActionTransportSchema, safeParseSchema} from '@so/model';
import {agentErr, agentOk, agentValidation, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {mapAgentTpActionTransportRow} from '@/lib/api/agent/tpAgentResourceMaps';
import {tpCall, ownedTpRow} from '@/lib/api/agent/tpAgentCall';
import {createDbTpActionTransportForAgent} from '@/lib/api/db/tp/createDbTpActionTransport';
import {deleteDbTpActionTransportForAgent} from '@/lib/api/db/tp/deleteDbTpActionTransport';
import {updateDbTpActionTransportForAgent} from '@/lib/api/db/tp/updateDbTpActionTransport';

export async function linkAgentTpActionTransport(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const parsed = safeParseSchema(LinkActionTransportSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const {podId, actionId, transportLibId, sortOrder, durationMinutes, costAmount, costCurrency, fromLocationId, toLocationId} =
    parsed.value;
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.CREATE));
  if (!ctx.ok) {
    return ctx;
  }
  const ownedAction = await ownedTpRow(ctx.data, 'tp_action', actionId, podId);
  if (!ownedAction.ok) {
    return ownedAction;
  }
  const ownedLib = await ownedTpRow(ctx.data, 'tp_transport_lib', transportLibId, podId);
  if (!ownedLib.ok) {
    return ownedLib;
  }
  const result = await createDbTpActionTransportForAgent(ctx.data.supabase, {
    actionId,
    transportLibId,
    sortOrder: sortOrder ?? 0,
    durationMinutes,
    costAmount,
    costCurrency,
    fromLocationId,
    toLocationId,
  });
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  if (result.data === null) {
    return agentErr(500, 'internal_error', 'Failed to link transport');
  }
  return agentOk(mapAgentTpActionTransportRow(result.data));
}

export async function updateAgentTpActionTransport(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const parsed = safeParseSchema(UpdateActionTransportSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const {podId, linkId, sortOrder, durationMinutes, costAmount, costCurrency, fromLocationId, toLocationId} = parsed.value;
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) {
    return ctx;
  }
  const owned = await ownedTpRow(ctx.data, 'tp_action_transport', linkId, podId);
  if (!owned.ok) {
    return owned;
  }
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const result = await updateDbTpActionTransportForAgent(ctx.data.supabase, linkId, {
    sortOrder,
    durationMinutes: 'durationMinutes' in args ? durationMinutes ?? null : undefined,
    costAmount: 'costAmount' in args ? costAmount ?? null : undefined,
    costCurrency: 'costCurrency' in args ? costCurrency ?? null : undefined,
    fromLocationId: 'fromLocationId' in args ? fromLocationId ?? null : undefined,
    toLocationId: 'toLocationId' in args ? toLocationId ?? null : undefined,
  });
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  if (result.data === null) {
    return agentErr(404, 'not_found', 'Transport link not found');
  }
  return agentOk(mapAgentTpActionTransportRow(result.data));
}

export async function unlinkAgentTpActionTransport(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const linkId = typeof args.linkId === 'string' ? args.linkId : '';
  if (!podId || !linkId) {
    return agentErr(400, 'validation_error', 'podId and linkId are required');
  }
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.DELETE));
  if (!ctx.ok) {
    return ctx;
  }
  const owned = await ownedTpRow(ctx.data, 'tp_action_transport', linkId, podId);
  if (!owned.ok) {
    return owned;
  }
  const result = await deleteDbTpActionTransportForAgent(ctx.data.supabase, linkId);
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  return agentOk({ok: true});
}
