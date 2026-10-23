/**
 * Trip planning agent: workspace operations
 */

import {ApiKeyAction, CreateTripSchema, safeParseSchema, TpActionKind, tpBudgetRollup} from '@so/model';
import {agentOk, agentValidation, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {tpCall} from '@/lib/api/agent/tpAgentCall';
import {
  agentTripAlreadyExists,
  agentTripNotSetup,
  TP_TRIP_SETUP_HINT,
} from '@/lib/api/agent/tpAgentTrip';
import {createDbTpTripBundleWithClient} from '@/lib/api/db/tp/createDbTpTripBundle';
import {
  loadDbTpWorkspace,
  type DbTpAction,
  type DbTpRoute,
  type DbTpTransport,
} from '@/lib/api/db/tp/loadDbTpWorkspace';
import type {UpdateTpTripInput} from '@/lib/api/db/tp/updateDbTpTrip';

function destinationNamesFromInput(args: Record<string, unknown>): readonly string[] {
  if (Array.isArray(args.destinationNames)) {
    return args.destinationNames.filter((name): name is string => typeof name === 'string');
  }
  if (typeof args.destinations === 'string') {
    return args.destinations.split('\n');
  }
  return [];
}

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

  const base = workspace.data ?? {
    days: [],
    destinations: [],
    dayDestinationLinks: [],
    actions: [],
    routes: [],
    transports: [],
    attachments: [],
    locations: [],
    actionLocations: [],
    transportLib: [],
    actionTransports: [],
  };

  if (base.trip === undefined) {
    return agentOk({
      ...base,
      trip: null,
      tripSetupRequired: true,
      message: TP_TRIP_SETUP_HINT,
    });
  }

  return agentOk(base);
}

/**
 * Create trip (same bundle as the web UI create form)
 */
export async function createAgentTpTrip(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const parsed = safeParseSchema(CreateTripSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }

  const ctx = await requirePodAgent(request, tpCall(parsed.value.podId, ApiKeyAction.CREATE));
  if (!ctx.ok) {
    return ctx;
  }

  const existing = await ctx.data.supabase.from('tp_trip').select('id').eq('pod_id', parsed.value.podId).maybeSingle();
  const existingErr = dbErr(existing.error);
  if (existingErr !== undefined) {
    return existingErr;
  }
  if (existing.data !== null) {
    return agentTripAlreadyExists();
  }

  const destinationNames =
    parsed.value.destinationNames ??
    (typeof input === 'object' && input !== null && !Array.isArray(input)
      ? destinationNamesFromInput(input as Record<string, unknown>)
      : []);

  try {
    const tripId = await createDbTpTripBundleWithClient(ctx.data.supabase, {
      podId: parsed.value.podId,
      title: parsed.value.title.trim(),
      timezone: parsed.value.timezone.trim() || 'UTC',
      startDate: parsed.value.startDate,
      endDate: parsed.value.endDate,
      destinationNames,
      budgetAmount: parsed.value.budgetAmount,
      budgetCurrency: parsed.value.budgetCurrency,
    });
    const workspace = await loadDbTpWorkspace(ctx.data.supabase, parsed.value.podId);
    const workspaceErr = dbErr(workspace.error);
    if (workspaceErr !== undefined) {
      return workspaceErr;
    }
    return agentOk({tripId, workspace: workspace.data});
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return agentValidation(message);
  }
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
    return agentTripNotSetup();
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

  const workspace = await loadDbTpWorkspace(ctx.data.supabase, podId);
  const workspaceErr = dbErr(workspace.error);
  if (workspaceErr !== undefined) {
    return workspaceErr;
  }

  if (workspace.data === null || workspace.data.trip === undefined) {
    return agentTripNotSetup();
  }

  const actions: readonly DbTpAction[] = workspace.data.actions;
  const routes: readonly DbTpRoute[] = workspace.data.routes;
  const transports: readonly DbTpTransport[] = workspace.data.transports;

  const totalCost = tpBudgetRollup(
    actions.map((action) => ({
      kind: action.kind as TpActionKind,
      costAmount: action.costAmount,
      selectedRouteId: action.selectedRouteId,
    })),
    routes.map((route) => ({id: route.id, costAmount: route.costAmount})),
    transports.map((transport) => ({routeId: transport.routeId, costAmount: transport.costAmount})),
  );

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
