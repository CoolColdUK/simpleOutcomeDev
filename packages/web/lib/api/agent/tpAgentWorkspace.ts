/**
 * Trip planning agent: workspace operations
 */

import {ApiKeyAction} from '@so/model';
import {agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {tpCall} from '@/lib/api/agent/tpAgentCall';
import ensureDbTpTrip from '@/lib/api/db/tp/ensureDbTpTrip';
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
  
  const ensured = await ensureDbTpTrip(ctx.data.supabase, podId);
  const ensuredErr = dbErr(ensured.error);
  if (ensuredErr !== undefined) {
    return ensuredErr;
  }

  const workspace = await loadDbTpWorkspace(ctx.data.supabase, podId);
  const workspaceErr = dbErr(workspace.error);
  if (workspaceErr !== undefined) {
    return workspaceErr;
  }

  if (workspace.data?.trip === undefined) {
    return {ok: false, status: 500, code: 'internal_error', message: 'Trip workspace is missing after ensure'};
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
  
  const tripInput: UpdateTpTripInput = {
    podId,
    ...(typeof args.title === 'string' ? {title: args.title} : {}),
    ...(typeof args.timezone === 'string' ? {timezone: args.timezone} : {}),
    ...(typeof args.startDate === 'string' ? {startDate: args.startDate} : {}),
    ...(typeof args.endDate === 'string' ? {endDate: args.endDate} : {}),
    ...(typeof args.status === 'string' ? {status: args.status} : {}),
    ...(typeof args.budgetAmount === 'number' ? {budgetAmount: args.budgetAmount} : {}),
    ...(typeof args.budgetCurrency === 'string' ? {budgetCurrency: args.budgetCurrency} : {}),
    ...(typeof args.defaultCurrency === 'string' ? {defaultCurrency: args.defaultCurrency} : {}),
    ...(typeof args.mapsUrl === 'string' ? {mapsUrl: args.mapsUrl} : {}),
    ...(typeof args.notes === 'string' ? {notes: args.notes} : {}),
  };

  const {default: updateDbTpTrip} = await import('@/lib/api/db/tp/updateDbTpTrip');
  const result = await updateDbTpTrip(ctx.data.supabase, tripInput);
  
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) {
    return resultErr;
  }
  
  if (result.data === null) {
    return {ok: false, status: 404, code: 'not_found', message: 'Trip not found'};
  }
  
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
  const ensured = await ensureDbTpTrip(ctx.data.supabase, podId);
  const ensuredErr = dbErr(ensured.error);
  if (ensuredErr !== undefined) {
    return ensuredErr;
  }

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
