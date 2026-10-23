/**
 * Trip planning agent: day operations
 */

import {ApiKeyAction} from '@so/model';
import {agentErr, agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {tpCall, ownedTpRow} from '@/lib/api/agent/tpAgentCall';
import {updateDbTpDayForAgent, type UpdateTpDayInput} from '@/lib/api/db/tp/updateDbTpDay';

export async function updateAgentTpDay(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const dayId = typeof args.dayId === 'string' ? args.dayId : '';
  
  if (!podId || !dayId) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId and dayId are required'};
  }
  
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) return ctx;
  
  // Verify ownership
  const owned = await ownedTpRow(ctx.data, 'tp_day', dayId, podId);
  if (!owned.ok) return owned;
  
  const dayInput: UpdateTpDayInput = {
    dayId,
    ...(typeof args.dayTitle === 'string' ? {day_title: args.dayTitle} : {}),
    ...(typeof args.dayNotes === 'string' ? {day_notes: args.dayNotes} : {}),
    ...(typeof args.primaryDestinationId === 'string' ? {primary_destination_id: args.primaryDestinationId} : {}),
  };

  const result = await updateDbTpDayForAgent(ctx.data.supabase, dayInput);
  
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  if (result.data === null) return agentErr(404, 'not_found', 'Day not found');
  
  return agentOk(result.data);
}
