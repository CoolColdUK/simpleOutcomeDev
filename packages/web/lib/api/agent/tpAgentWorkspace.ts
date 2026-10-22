/**
 * Trip planning agent: workspace operations
 */

import {ApiKeyAction} from '@so/model';
import {agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {tpCall} from '@/lib/api/agent/tpAgentCall';
import {
  loadDbTpWorkspace,
  type DbTpAction,
  type DbTpRoute,
  type DbTpTransport,
} from '@/lib/api/db/tp/loadDbTpWorkspace';
import type {UpdateTpTripInput} from '@/lib/api/db/tp/updateDbTpTrip';

/**
 * Load full trip workspace
 */
export async function getAgentTpWorkspace(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const podId = typeof input === 'object' && input !== null && 'podId' in input && typeof input.podId === 'string' ? input.podId : '';
  
  if (!podId) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId is required'};
  }
  
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.READ));
  
  if (!ctx.ok) {
    return ctx;
  }
  
  const workspace = await loadDbTpWorkspace(ctx.data.supabase, podId);
  const workspaceErr = dbErr(workspace.error);
  if (workspaceErr !== undefined) {
    return workspaceErr;
  }
  
  return agentOk(workspace.data);
}

/**
 * Update trip metadata and settings
 */
export async function updateAgentTpTrip(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  
  if (!podId) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId is required'};
  }
  
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.UPDATE));
  
  if (!ctx.ok) {
    return ctx;
  }
  
  const updates: UpdateTpTripInput = {podId};
  
  if ('title' in args && typeof args.title === 'string') updates.title = args.title;
  if ('timezone' in args && typeof args.timezone === 'string') updates.timezone = args.timezone;
  if ('startDate' in args && typeof args.startDate === 'string') updates.startDate = args.startDate;
  if ('endDate' in args && typeof args.endDate === 'string') updates.endDate = args.endDate;
  if ('status' in args && typeof args.status === 'string') updates.status = args.status;
  if ('budgetAmount' in args && typeof args.budgetAmount === 'number') updates.budgetAmount = args.budgetAmount;
  if ('budgetCurrency' in args && typeof args.budgetCurrency === 'string') updates.budgetCurrency = args.budgetCurrency;
  if ('defaultCurrency' in args && typeof args.defaultCurrency === 'string') updates.defaultCurrency = args.defaultCurrency;
  if ('mapsUrl' in args && typeof args.mapsUrl === 'string') updates.mapsUrl = args.mapsUrl;
  if ('notes' in args && typeof args.notes === 'string') updates.notes = args.notes;
  
  const {default: updateDbTpTrip} = await import('@/lib/api/db/tp/updateDbTpTrip');
  const result = await updateDbTpTrip(ctx.data.supabase, updates);
  
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  
  if (result.data === null) {
    return {ok: false, status: 404, code: 'not_found', message: 'Trip not found'};
  }
  
  // TODO: If dates changed, sync tp_day rows (syncTpDaysForTrip)
  
  return agentOk(result.data);
}

/**
 * Get trip budget rollup
 */
export async function getAgentTpBudgetRollup(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const podId = typeof input === 'object' && input !== null && 'podId' in input && typeof input.podId === 'string' ? input.podId : '';
  
  if (!podId) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId is required'};
  }
  
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.READ));
  
  if (!ctx.ok) {
    return ctx;
  }
  
  // Load workspace to compute budget
  const workspace = await loadDbTpWorkspace(ctx.data.supabase, podId);
  const workspaceErr = dbErr(workspace.error);
  if (workspaceErr !== undefined) {
    return workspaceErr;
  }
  
  if (workspace.data === null || workspace.data.trip === undefined) {
    return {ok: false, status: 404, code: 'not_found', message: 'Trip not found'};
  }
  
  // Compute total costs
  let totalCost = 0;
  
  // Actions (stay/activity/note): count cost once per action
  const actions: readonly DbTpAction[] = workspace.data.actions;
  actions.forEach((action) => {
    if (action.costAmount !== undefined) {
      totalCost += action.costAmount;
    }
  });
  
  // Transports: sum costs of transports on selected routes
  const routes: readonly DbTpRoute[] = workspace.data.routes;
  const transports: readonly DbTpTransport[] = workspace.data.transports;
  
  actions.forEach((action) => {
    if (action.kind === 'travel' && action.selectedRouteId !== undefined) {
      const selectedRoute = routes.find((route) => route.id === action.selectedRouteId);
      if (selectedRoute !== undefined) {
        const routeTransports = transports.filter((transport) => transport.routeId === selectedRoute.id);
        routeTransports.forEach((transport) => {
          if (transport.costAmount !== undefined) {
            totalCost += transport.costAmount;
          }
        });
      }
    }
  });
  
  const trip = workspace.data.trip;
  const budgetAmount = trip.budgetAmount ?? 0;
  
  return agentOk({
    totalCost,
    budgetAmount,
    breakdown: {
      actionCosts: actions.filter((action) => action.costAmount !== undefined).length,
      transportCosts: transports.filter((transport) => transport.costAmount !== undefined).length,
    },
  });
}
