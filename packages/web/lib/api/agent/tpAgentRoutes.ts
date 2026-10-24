/**
 * Trip planning agent: route operations
 */

import {ApiKeyAction, UpdateRouteSchema, safeParseSchema} from '@so/model';
import {agentErr, agentOk, agentValidation, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {tpCall, ownedTpRow} from '@/lib/api/agent/tpAgentCall';
import {createDbTpRouteForAgent} from '@/lib/api/db/tp/createDbTpRoute';
import {deleteDbTpRouteForAgent} from '@/lib/api/db/tp/deleteDbTpRoute';
import {selectDbTpRouteForAgent} from '@/lib/api/db/tp/selectDbTpRoute';
import {updateDbTpRouteForAgent} from '@/lib/api/db/tp/updateDbTpRoute';

function mapAgentTpRouteRow(row: {
  id: string;
  action_id: string;
  name: string;
  is_selected: boolean;
  notes: string | null;
  sort_order: number;
  cost_amount: string | null;
  cost_currency: string | null;
  duration_minutes: number | null;
  transport_lib_id: string | null;
}) {
  const num = (value: string | null): number | undefined => {
    if (value === null || value === '') {
      return undefined;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    id: row.id,
    actionId: row.action_id,
    name: row.name,
    isSelected: row.is_selected,
    notes: row.notes ?? undefined,
    sortOrder: row.sort_order,
    costAmount: num(row.cost_amount),
    costCurrency: row.cost_currency ?? undefined,
    durationMinutes: row.duration_minutes ?? undefined,
    transportLibId: row.transport_lib_id ?? undefined,
  };
}

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
  
  const owned = await ownedTpRow(ctx.data, 'tp_action', actionId, podId);
  if (!owned.ok) return owned;
  
  const result = await createDbTpRouteForAgent(ctx.data.supabase, {
    actionId,
    name,
    notes: typeof args.notes === 'string' ? args.notes : undefined,
    sortOrder: typeof args.sortOrder === 'number' ? args.sortOrder : 0,
  });
  
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  if (result.data === null) return agentErr(500, 'internal_error', 'Failed to create route');
  
  return agentOk(mapAgentTpRouteRow(result.data));
}

export async function updateAgentTpRoute(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const parsed = safeParseSchema(UpdateRouteSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const {podId, routeId, name, notes, sortOrder, costAmount, costCurrency, durationMinutes, transportLibId} =
    parsed.value;
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) return ctx;
  
  const owned = await ownedTpRow(ctx.data, 'tp_route', routeId, podId);
  if (!owned.ok) return owned;
  
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const result = await updateDbTpRouteForAgent(ctx.data.supabase, routeId, {
    name,
    notes: 'notes' in args ? (notes ?? null) : undefined,
    sortOrder,
    costAmount: 'costAmount' in args ? (costAmount ?? null) : undefined,
    costCurrency: 'costCurrency' in args ? (costCurrency ?? null) : undefined,
    durationMinutes: 'durationMinutes' in args ? (durationMinutes ?? null) : undefined,
    transportLibId: 'transportLibId' in args ? (transportLibId ?? null) : undefined,
  });
  
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  if (result.data === null) return agentErr(404, 'not_found', 'Route not found');
  
  return agentOk(mapAgentTpRouteRow(result.data));
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
  
  const owned = await ownedTpRow(ctx.data, 'tp_route', routeId, podId);
  if (!owned.ok) return owned;
  
  const result = await deleteDbTpRouteForAgent(ctx.data.supabase, routeId);
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
  
  const ownedAction = await ownedTpRow(ctx.data, 'tp_action', actionId, podId);
  if (!ownedAction.ok) return ownedAction;
  
  const ownedRoute = await ownedTpRow(ctx.data, 'tp_route', routeId, podId);
  if (!ownedRoute.ok) return ownedRoute;
  
  const result = await selectDbTpRouteForAgent(ctx.data.supabase, {actionId, routeId});
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  
  return agentOk({ok: true});
}
