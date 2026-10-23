import {ApiKeyAction} from '@so/model';
import {agentErr, agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {tpCall, ownedTpRow} from '@/lib/api/agent/tpAgentCall';
import {createDbTpActionTransportForAgent} from '@/lib/api/db/tp/createDbTpActionTransport';
import {deleteDbTpActionTransportForAgent} from '@/lib/api/db/tp/deleteDbTpActionTransport';

export async function linkAgentTpActionTransport(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const actionId = typeof args.actionId === 'string' ? args.actionId : '';
  const transportLibId = typeof args.transportLibId === 'string' ? args.transportLibId : '';
  if (!podId || !actionId || !transportLibId) {
    return agentErr(400, 'validation_error', 'podId, actionId, and transportLibId are required');
  }
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
    sortOrder: typeof args.sortOrder === 'number' ? args.sortOrder : 0,
  });
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  if (result.data === null) {
    return agentErr(500, 'internal_error', 'Failed to link transport');
  }
  return agentOk(result.data);
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
