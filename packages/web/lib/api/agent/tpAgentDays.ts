/**
 * Trip planning agent: day operations
 */

import {ApiKeyAction} from '@so/model';
import {agentErr, agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {tpCall, ownedTpRow} from '@/lib/api/agent/tpAgentCall';
import {updateDbTpDay} from '@/lib/api/db/tp/updateDbTpDay';

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
  
  const updates: Record<string, unknown> = {};
  if ('dayTitle' in args) updates.day_title = args.dayTitle;
  if ('dayNotes' in args) updates.day_notes = args.dayNotes;
  if ('primaryDestinationId' in args) updates.primary_destination_id = args.primaryDestinationId;
  
  const result = await updateDbTpDay(ctx.data.supabase, {
    dayId,
    ...updates,
  } as any);
  
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  if (result.data === null) return agentErr(404, 'not_found', 'Day not found');
  
  return agentOk(result.data);
}
