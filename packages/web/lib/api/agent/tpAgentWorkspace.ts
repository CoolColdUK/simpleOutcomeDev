/**
 * Trip planning agent: workspace operations
 */

import {ApiKeyAction} from '@so/model';
import {agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {tpCall} from '@/lib/api/agent/tpAgentCall';
import {loadDbTpWorkspace} from '@/lib/api/db/tp/loadDbTpWorkspace';

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
  
  // TODO: Implement trip update with syncTpDaysForTrip on date change
  // This is a placeholder showing the pattern
  
  return agentOk({message: 'Trip update not yet implemented', podId});
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
  
  // TODO: Implement budget rollup using tpBudgetRollup helper
  // This is a placeholder showing the pattern
  
  return agentOk({totalCost: 0, budgetAmount: 0, breakdown: []});
}
