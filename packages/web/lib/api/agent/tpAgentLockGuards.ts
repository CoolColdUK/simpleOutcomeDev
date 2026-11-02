import {TP_ACTIVITY_LOCKED_CODE, TP_TRIP_LOCKED_CODE} from '@so/model';
import {agentErr, agentOk, type AgentErr, type AgentResult} from '@/lib/api/agent/agentResult';
import type {AgentContext} from '@/lib/api/agent/loadAgentContext';
import {
  assertTpActionContentUnlocked,
  assertTpTripUnlocked,
  assertTpTripUnlockedByPodId,
} from '@/lib/api/db/tp/tpDbLockChecks';

function lockAgentErr(error: unknown): AgentErr | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }
  if (error.name === TP_TRIP_LOCKED_CODE) {
    return agentErr(409, TP_TRIP_LOCKED_CODE, error.message);
  }
  if (error.name === TP_ACTIVITY_LOCKED_CODE) {
    return agentErr(409, TP_ACTIVITY_LOCKED_CODE, error.message);
  }
  return undefined;
}

export async function agentAssertTpTripUnlocked(ctx: AgentContext, tripId: string): Promise<AgentResult<true>> {
  try {
    await assertTpTripUnlocked(ctx.supabase, tripId);
    return agentOk(true);
  } catch (e: unknown) {
    return lockAgentErr(e) ?? agentErr(500, 'internal_error', e instanceof Error ? e.message : String(e));
  }
}

export async function agentAssertTpTripUnlockedByPodId(ctx: AgentContext, podId: string): Promise<AgentResult<string>> {
  try {
    const tripId = await assertTpTripUnlockedByPodId(ctx.supabase, podId);
    return agentOk(tripId);
  } catch (e: unknown) {
    const locked = lockAgentErr(e);
    if (locked !== undefined) {
      return locked;
    }
    return agentErr(404, 'not_found', e instanceof Error ? e.message : String(e));
  }
}

export async function agentAssertTpActionContentUnlocked(
  ctx: AgentContext,
  actionId: string,
): Promise<AgentResult<true>> {
  try {
    await assertTpActionContentUnlocked(ctx.supabase, actionId);
    return agentOk(true);
  } catch (e: unknown) {
    return lockAgentErr(e) ?? agentErr(500, 'internal_error', e instanceof Error ? e.message : String(e));
  }
}

export function isTpLockError(error: unknown): error is Error {
  return error instanceof Error && (error.name === TP_TRIP_LOCKED_CODE || error.name === TP_ACTIVITY_LOCKED_CODE);
}
