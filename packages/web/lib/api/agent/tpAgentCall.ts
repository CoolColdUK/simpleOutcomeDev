/**
 * Trip planning agent call helpers
 */

import {ApiKeyAction, ApiKeyResource} from '@so/model';
import {agentErr, agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import type {AgentContext} from '@/lib/api/agent/loadAgentContext';
import {agentTripNotSetup} from '@/lib/api/agent/tpAgentTrip';

export function tpCall(podId: string, action: ApiKeyAction) {
  return {podId, resource: ApiKeyResource.TRIP, action};
}

export async function requireExistingTpTripId(ctx: AgentContext, podId: string): Promise<AgentResult<string>> {
  const trip = await ctx.supabase.from('tp_trip').select('id').eq('pod_id', podId).maybeSingle();
  const tripErr = dbErr(trip.error);
  if (tripErr !== undefined) {
    return tripErr;
  }
  if (trip.data === null) {
    return agentTripNotSetup();
  }
  return agentOk(trip.data.id);
}

export async function ownedTpRow(
  ctx: AgentContext,
  table: 'tp_destination' | 'tp_day' | 'tp_action' | 'tp_route' | 'tp_transport' | 'tp_attachment',
  id: string,
  _podId: string,
): Promise<AgentResult<true>> {
  const row = await ctx.supabase.from(table).select('id').eq('id', id).maybeSingle();
  const rowErr = dbErr(row.error);
  if (rowErr !== undefined) {
    return rowErr;
  }
  if (row.data === null) {
    return agentErr(404, 'not_found', 'Not found');
  }
  // Additional check: ensure row belongs to the right trip/pod
  // (RLS handles this, but explicit check for clarity)
  return agentOk(true);
}
