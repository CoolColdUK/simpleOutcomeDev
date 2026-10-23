/**
 * Trip planning agent: activity place operations
 */

import {ApiKeyAction, TpActionKind} from '@so/model';
import {agentErr, agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent, type AgentContext} from '@/lib/api/agent/loadAgentContext';
import {tpCall, ownedTpRow} from '@/lib/api/agent/tpAgentCall';
import {createDbTpActivityPlaceForAgent} from '@/lib/api/db/tp/createDbTpActivityPlace';
import {updateDbTpActivityPlaceForAgent} from '@/lib/api/db/tp/updateDbTpActivityPlace';
import {deleteDbTpActivityPlaceForAgent} from '@/lib/api/db/tp/deleteDbTpActivityPlace';

async function requireActivityAction(ctx: AgentContext, actionId: string, podId: string): Promise<AgentResult<true>> {
  const owned = await ownedTpRow(ctx, 'tp_action', actionId, podId);
  if (!owned.ok) {
    return owned;
  }
  const action = await ctx.supabase.from('tp_action').select('kind').eq('id', actionId).maybeSingle();
  const actionErr = dbErr(action.error);
  if (actionErr !== undefined) {
    return actionErr;
  }
  if (action.data === null || action.data.kind !== TpActionKind.ACTIVITY) {
    return agentErr(400, 'validation_error', 'actionId must reference an activity');
  }
  return agentOk(true);
}

export async function createAgentTpActivityPlace(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const actionId = typeof args.actionId === 'string' ? args.actionId : '';
  const placeText = typeof args.placeText === 'string' ? args.placeText.trim() : '';

  if (!podId || !actionId || placeText === '') {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId, actionId, and placeText are required'};
  }

  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.CREATE));
  if (!ctx.ok) {
    return ctx;
  }

  const activityCheck = await requireActivityAction(ctx.data, actionId, podId);
  if (!activityCheck.ok) {
    return activityCheck;
  }

  const result = await createDbTpActivityPlaceForAgent(ctx.data.supabase, {
    actionId,
    placeText,
    mapsUrl: typeof args.mapsUrl === 'string' ? args.mapsUrl : undefined,
    notes: typeof args.notes === 'string' ? args.notes : undefined,
    sortOrder: typeof args.sortOrder === 'number' ? args.sortOrder : 0,
  });
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  if (result.data === null) {
    return agentErr(500, 'internal_error', 'Failed to create activity place');
  }
  return agentOk(result.data);
}

export async function updateAgentTpActivityPlace(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const placeId = typeof args.placeId === 'string' ? args.placeId : '';

  if (!podId || !placeId) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId and placeId are required'};
  }

  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) {
    return ctx;
  }

  const owned = await ownedTpRow(ctx.data, 'tp_activity_place', placeId, podId);
  if (!owned.ok) {
    return owned;
  }

  const result = await updateDbTpActivityPlaceForAgent(ctx.data.supabase, {
    placeId,
    placeText: typeof args.placeText === 'string' ? args.placeText : undefined,
    mapsUrl: typeof args.mapsUrl === 'string' ? args.mapsUrl : args.mapsUrl === null ? null : undefined,
    notes: typeof args.notes === 'string' ? args.notes : args.notes === null ? null : undefined,
    sortOrder: typeof args.sortOrder === 'number' ? args.sortOrder : undefined,
  });
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  if (result.data === null) {
    return agentErr(404, 'not_found', 'Activity place not found');
  }
  return agentOk(result.data);
}

export async function deleteAgentTpActivityPlace(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const placeId = typeof args.placeId === 'string' ? args.placeId : '';

  if (!podId || !placeId) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId and placeId are required'};
  }

  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.DELETE));
  if (!ctx.ok) {
    return ctx;
  }

  const owned = await ownedTpRow(ctx.data, 'tp_activity_place', placeId, podId);
  if (!owned.ok) {
    return owned;
  }

  const result = await deleteDbTpActivityPlaceForAgent(ctx.data.supabase, placeId);
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  return agentOk({ok: true});
}
