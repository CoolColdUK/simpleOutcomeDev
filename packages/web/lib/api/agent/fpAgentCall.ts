import {ApiKeyAction, ApiKeyResource, FpResource} from '@so/model';
import {agentErr, agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import type {AgentContext} from '@/lib/api/agent/loadAgentContext';

export const FP_TX_COLUMNS =
  'id, pod_id, account_id, posted_date, posted_time, amount, description, recipient, notes, external_id, category_id, confirmed, parser_id, import_id, archived, parent_id, split_portion_count, split_recurrence, created_by';

export function fpCall(podId: string, action: ApiKeyAction, fpResource: FpResource) {
  return {podId, resource: ApiKeyResource.FP, action, fpResource};
}

export async function ownedFpRow(
  ctx: AgentContext,
  table: 'fp_account' | 'fp_category' | 'fp_transaction',
  id: string,
  podId: string,
): Promise<AgentResult<true>> {
  const row = await ctx.supabase.from(table).select('id').eq('id', id).eq('pod_id', podId).maybeSingle();
  const rowErr = dbErr(row.error);
  if (rowErr !== undefined) {
    return rowErr;
  }
  if (row.data === null) {
    return agentErr(404, 'not_found', 'Not found');
  }
  return agentOk(true);
}
