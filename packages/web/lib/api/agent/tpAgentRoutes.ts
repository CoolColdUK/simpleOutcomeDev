/**
 * Trip planning agent: route operations
 */

import {ApiKeyAction} from '@so/model';
import {agentErr, agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {tpCall, ownedTpRow} from '@/lib/api/agent/tpAgentCall';
import {createDbTpRoute} from '@/lib/api/db/tp/createDbTpRoute';
import {deleteDbTpRoute} from '@/lib/api/db/tp/deleteDbTpRoute';
import {selectDbTpRoute} from '@/lib/api/db/tp/selectDbTpRoute';

export async function createAgentTpRoute(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const actionId = typeof args.actionId === 'string' ? args.actionId : '';
  const name = typeof args.name === 'string' ? args.name : '';
  
  if (!podId || !actionId || !name) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId, actionId, and name are required'};
  }
  
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.CREATE));
  if (!ctx.ok) return ctx;
  
  // Verify action ownership
  const owned = await ownedTpRow(ctx.data, 'tp_action', actionId, podId);
  if (!owned.ok) return owned;
  
  const result = await createDbTpRoute(ctx.data.supabase, {
    actionId,
    name,
    notes: typeof args.notes === 'string' ? args.notes : undefined,
    sortOrder: typeof args.sortOrder === 'number' ? args.sortOrder : 0,
  });
  
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  if (result.data === null) return agentErr(500, 'internal_error', 'Failed to create route');
  
  return agentOk(result.data);
}

export async function updateAgentTpRoute(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const routeId = typeof args.routeId === 'string' ? args.routeId : '';
  
  if (!podId || !routeId) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId and routeId are required'};
  }
  
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) return ctx;
  
  // Verify ownership
  const owned = await ownedTpRow(ctx.data, 'tp_route', routeId, podId);
  if (!owned.ok) return owned;
  
  const updates: Record<string, unknown> = {};
  if ('name' in args) updates.name = args.name;
  if ('notes' in args) updates.notes = args.notes;
  if ('sortOrder' in args) updates.sort_order = args.sortOrder;
  
  const result = await ctx.data.supabase
    .from('tp_route')
    .update(updates)
    .eq('id', routeId)
    .select('*')
    .single();
  
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  if (result.data === null) return agentErr(404, 'not_found', 'Route not found');
  
  return agentOk(result.data);
}

export async function deleteAgentTpRoute(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const routeId = typeof args.routeId === 'string' ? args.routeId : '';
  
  if (!podId || !routeId) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId and routeId are required'};
  }
  
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.DELETE));
  if (!ctx.ok) return ctx;
  
  // Verify ownership
  const owned = await ownedTpRow(ctx.data, 'tp_route', routeId, podId);
  if (!owned.ok) return owned;
  
  const result = await deleteDbTpRoute(ctx.data.supabase, routeId);
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  
  return agentOk({ok: true});
}

export async function selectAgentTpRoute(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const actionId = typeof args.actionId === 'string' ? args.actionId : '';
  const routeId = typeof args.routeId === 'string' ? args.routeId : '';
  
  if (!podId || !actionId || !routeId) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId, actionId, and routeId are required'};
  }
  
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) return ctx;
  
  // Verify ownership
  const ownedAction = await ownedTpRow(ctx.data, 'tp_action', actionId, podId);
  if (!ownedAction.ok) return ownedAction;
  
  const ownedRoute = await ownedTpRow(ctx.data, 'tp_route', routeId, podId);
  if (!ownedRoute.ok) return ownedRoute;
  
  const result = await selectDbTpRoute(ctx.data.supabase, {actionId, routeId});
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  
  return agentOk({ok: true});
}
