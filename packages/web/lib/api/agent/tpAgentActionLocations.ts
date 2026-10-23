import {ApiKeyAction, LinkActionLocationSchema, UpdateActionLocationSchema, safeParseSchema} from '@so/model';
import {agentErr, agentOk, agentValidation, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {tpCall, ownedTpRow} from '@/lib/api/agent/tpAgentCall';
import {createDbTpActionLocationForAgent} from '@/lib/api/db/tp/createDbTpActionLocation';
import {deleteDbTpActionLocationForAgent} from '@/lib/api/db/tp/deleteDbTpActionLocation';
import {updateDbTpActionLocationForAgent} from '@/lib/api/db/tp/updateDbTpActionLocation';

export async function linkAgentTpActionLocation(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const parsed = safeParseSchema(LinkActionLocationSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const {podId, actionId, locationId, sortOrder, done} = parsed.value;
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.CREATE));
  if (!ctx.ok) {
    return ctx;
  }
  const ownedAction = await ownedTpRow(ctx.data, 'tp_action', actionId, podId);
  if (!ownedAction.ok) {
    return ownedAction;
  }
  const ownedLocation = await ownedTpRow(ctx.data, 'tp_location', locationId, podId);
  if (!ownedLocation.ok) {
    return ownedLocation;
  }
  const result = await createDbTpActionLocationForAgent(ctx.data.supabase, {
    actionId,
    locationId,
    sortOrder: sortOrder ?? 0,
    done,
  });
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  if (result.data === null) {
    return agentErr(500, 'internal_error', 'Failed to link location');
  }
  return agentOk(result.data);
}

export async function updateAgentTpActionLocation(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const parsed = safeParseSchema(UpdateActionLocationSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const {podId, linkId, sortOrder, done} = parsed.value;
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) {
    return ctx;
  }
  const owned = await ownedTpRow(ctx.data, 'tp_action_location', linkId, podId);
  if (!owned.ok) {
    return owned;
  }
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const result = await updateDbTpActionLocationForAgent(ctx.data.supabase, linkId, {
    sortOrder,
    done: 'done' in args ? done : undefined,
  });
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  if (result.data === null) {
    return agentErr(404, 'not_found', 'Location link not found');
  }
  return agentOk(result.data);
}

export async function unlinkAgentTpActionLocation(request: Request, input: unknown): Promise<AgentResult<unknown>> {
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
  const owned = await ownedTpRow(ctx.data, 'tp_action_location', linkId, podId);
  if (!owned.ok) {
    return owned;
  }
  const result = await deleteDbTpActionLocationForAgent(ctx.data.supabase, linkId);
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  return agentOk({ok: true});
}
