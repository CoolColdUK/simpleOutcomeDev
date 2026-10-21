import {
  agentFpAssignSchema,
  agentFpBillSplitSchema,
  agentFpBulkAssignSchema,
  agentFpConfirmSchema,
  agentFpTransactionWriteSchema,
  agentPodIdSchema,
  ApiKeyAction,
  buildFpAutoAssignPreview,
  createFpSplitChildren,
  FpResource,
  FpSplitRecurrence,
  parseApiPage,
  safeParseSchema,
} from '@so/model';
import {agentErr, agentOk, agentValidation, dbErr, rpcErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {FP_TX_COLUMNS, fpCall, ownedFpRow} from '@/lib/api/agent/fpAgentCall';
import {requirePodAgent, type AgentContext} from '@/lib/api/agent/loadAgentContext';
import {mapDbFpCategory} from '@/lib/api/db/mapDbFpCategory';
import {mapDbFpTransaction} from '@/lib/api/db/mapDbFpTransaction';

export async function listAgentFpTransactions(request: Request, input: unknown): Promise<AgentResult<{readonly transactions: readonly unknown[]}>> {
  const parsed = safeParseSchema(agentFpTransactionWriteSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.READ, FpResource.TRANSACTION));
  if (!ctx.ok) {
    return ctx;
  }
  const page = parseApiPage(parsed.value.limit, parsed.value.offset);
  let query = ctx.data.supabase
    .from('fp_transaction')
    .select(FP_TX_COLUMNS)
    .eq('pod_id', parsed.value.podId)
    .order('posted_date', {ascending: false});
  if (parsed.value.startDate !== undefined) {
    query = query.gte('posted_date', parsed.value.startDate);
  }
  if (parsed.value.endDate !== undefined) {
    query = query.lte('posted_date', parsed.value.endDate);
  }
  if (parsed.value.accountId !== undefined) {
    query = query.eq('account_id', parsed.value.accountId);
  }
  if (parsed.value.archived !== undefined) {
    query = query.eq('archived', parsed.value.archived);
  }
  const rows = await query.range(page.offset, page.offset + page.limit - 1);
  const rowsErr = dbErr(rows.error);
  if (rowsErr !== undefined) {
    return rowsErr;
  }
  return agentOk({transactions: (rows.data ?? []).map(mapDbFpTransaction)});
}

export async function createAgentFpTransaction(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentFpTransactionWriteSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  if (parsed.value.accountId === undefined || parsed.value.postedDate === undefined || parsed.value.amount === undefined) {
    return agentValidation('Account, date, and amount are required');
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.CREATE, FpResource.TRANSACTION));
  if (!ctx.ok) {
    return ctx;
  }
  const account = await ownedFpRow(ctx.data, 'fp_account', parsed.value.accountId, parsed.value.podId);
  if (!account.ok) {
    return account;
  }
  const inserted = await ctx.data.supabase
    .from('fp_transaction')
    .insert({
      pod_id: parsed.value.podId,
      account_id: parsed.value.accountId,
      created_by: ctx.data.record.ownerUserId,
      posted_date: parsed.value.postedDate,
      amount: parsed.value.amount,
      posted_time: parsed.value.postedTime ?? null,
      description: parsed.value.description ?? '',
      recipient: parsed.value.recipient ?? '',
      notes: parsed.value.notes ?? '',
      category_id: parsed.value.categoryId ?? null,
      confirmed: true,
    })
    .select('id')
    .single();
  const insertedErr = dbErr(inserted.error);
  if (insertedErr !== undefined || inserted.data === null) {
    return insertedErr ?? agentErr(500, 'error', 'Request failed');
  }
  return agentOk({id: inserted.data.id});
}

export async function updateAgentFpTransaction(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentFpTransactionWriteSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const transactionId = parsed.value.transactionId;
  if (transactionId === undefined) {
    return agentValidation('Transaction is required');
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.UPDATE, FpResource.TRANSACTION));
  if (!ctx.ok) {
    return ctx;
  }
  const exists = await ownedFpRow(ctx.data, 'fp_transaction', transactionId, parsed.value.podId);
  if (!exists.ok) {
    return exists;
  }
  const value = parsed.value;
  const patch = {
    ...(value.postedDate === undefined ? {} : {posted_date: value.postedDate}),
    ...(value.postedTime === undefined ? {} : {posted_time: value.postedTime}),
    ...(value.amount === undefined ? {} : {amount: value.amount}),
    ...(value.description === undefined ? {} : {description: value.description}),
    ...(value.recipient === undefined ? {} : {recipient: value.recipient}),
    ...(value.notes === undefined ? {} : {notes: value.notes}),
    ...(value.categoryId === undefined ? {} : {category_id: value.categoryId}),
    ...(value.confirmed === undefined ? {} : {confirmed: value.confirmed}),
    ...(value.archived === undefined ? {} : {archived: value.archived}),
    ...(value.accountId === undefined ? {} : {account_id: value.accountId}),
  };
  const updated = await ctx.data.supabase.from('fp_transaction').update(patch).eq('id', transactionId).eq('pod_id', value.podId);
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  return agentOk({id: transactionId});
}

export async function deleteAgentFpTransaction(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentFpTransactionWriteSchema, input);
  if (!parsed.ok || parsed.value.transactionId === undefined) {
    return agentValidation(parsed.ok ? 'Transaction is required' : parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.DELETE, FpResource.TRANSACTION));
  if (!ctx.ok) {
    return ctx;
  }
  const removed = await ctx.data.supabase
    .from('fp_transaction')
    .delete()
    .eq('id', parsed.value.transactionId)
    .eq('pod_id', parsed.value.podId)
    .select('id');
  const removedErr = dbErr(removed.error);
  if (removedErr !== undefined) {
    return removedErr;
  }
  if ((removed.data ?? []).length === 0) {
    return agentErr(404, 'not_found', 'Not found');
  }
  return agentOk({id: parsed.value.transactionId});
}

export async function assignAgentFpTransactionCategory(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentFpAssignSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.UPDATE, FpResource.TRANSACTION));
  if (!ctx.ok) {
    return ctx;
  }
  const patch =
    parsed.value.categoryId === null
      ? {category_id: null}
      : {category_id: parsed.value.categoryId, confirmed: true};
  const updated = await ctx.data.supabase
    .from('fp_transaction')
    .update(patch)
    .eq('id', parsed.value.transactionId)
    .eq('pod_id', parsed.value.podId)
    .select('id');
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  if ((updated.data ?? []).length === 0) {
    return agentErr(404, 'not_found', 'Not found');
  }
  return agentOk({id: parsed.value.transactionId});
}

export async function bulkAssignAgentFpTransactionCategory(request: Request, input: unknown): Promise<AgentResult<{readonly count: number}>> {
  const parsed = safeParseSchema(agentFpBulkAssignSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.UPDATE, FpResource.TRANSACTION));
  if (!ctx.ok) {
    return ctx;
  }
  const updated = await ctx.data.supabase
    .from('fp_transaction')
    .update({category_id: parsed.value.categoryId, confirmed: true})
    .eq('pod_id', parsed.value.podId)
    .in('id', [...parsed.value.transactionIds]);
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  return agentOk({count: parsed.value.transactionIds.length});
}

export async function confirmAgentFpTransactions(request: Request, input: unknown): Promise<AgentResult<{readonly count: number}>> {
  const parsed = safeParseSchema(agentFpConfirmSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.UPDATE, FpResource.TRANSACTION));
  if (!ctx.ok) {
    return ctx;
  }
  const updated = await ctx.data.supabase
    .from('fp_transaction')
    .update({confirmed: true})
    .eq('pod_id', parsed.value.podId)
    .in('id', [...parsed.value.transactionIds]);
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  return agentOk({count: parsed.value.transactionIds.length});
}

async function loadAutoAssign(ctx: AgentContext, podId: string) {
  const [categories, transactions] = await Promise.all([
    ctx.supabase
      .from('fp_category')
      .select('id, pod_id, name, direction, budget_amount, budget_period, favourite, sort_order, colour, filters, is_group, parent_id')
      .eq('pod_id', podId),
    ctx.supabase.from('fp_transaction').select(FP_TX_COLUMNS).eq('pod_id', podId),
  ]);
  const categoriesErr = dbErr(categories.error);
  if (categoriesErr !== undefined) {
    return categoriesErr;
  }
  const transactionsErr = dbErr(transactions.error);
  if (transactionsErr !== undefined) {
    return transactionsErr;
  }
  const rules = (categories.data ?? []).map(mapDbFpCategory).map((category) => ({
    id: category.id,
    filters: category.filters,
    isGroup: category.isGroup,
  }));
  const txs = (transactions.data ?? []).map(mapDbFpTransaction);
  return agentOk(
    buildFpAutoAssignPreview(
      txs.map((tx) => ({
        id: tx.id,
        accountId: tx.accountId,
        postedDate: tx.postedDate,
        description: tx.description,
        recipient: tx.recipient,
        amount: tx.amount,
        archived: tx.archived,
        categoryId: tx.categoryId,
      })),
      rules,
    ),
  );
}

export async function previewAgentFpAutoAssign(request: Request, input: unknown): Promise<AgentResult<{readonly rows: readonly unknown[]}>> {
  const parsed = safeParseSchema(agentPodIdSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.READ, FpResource.TRANSACTION));
  if (!ctx.ok) {
    return ctx;
  }
  const preview = await loadAutoAssign(ctx.data, parsed.value.podId);
  if (!preview.ok) {
    return preview;
  }
  return agentOk({rows: preview.data});
}

export async function applyAgentFpAutoAssign(request: Request, input: unknown): Promise<AgentResult<{readonly count: number}>> {
  const parsed = safeParseSchema(agentPodIdSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.UPDATE, FpResource.TRANSACTION));
  if (!ctx.ok) {
    return ctx;
  }
  const preview = await loadAutoAssign(ctx.data, parsed.value.podId);
  if (!preview.ok) {
    return preview;
  }
  const updates = preview.data.filter((row) => row.kind === 'unique');
  const applied = await Promise.all(
    updates.map((row) =>
      ctx.data.supabase
        .from('fp_transaction')
        .update({category_id: row.categoryId, confirmed: false})
        .eq('id', row.transactionId)
        .eq('pod_id', parsed.value.podId)
        .is('category_id', null),
    ),
  );
  const failed = applied.map((item) => dbErr(item.error)).find((item) => item !== undefined);
  if (failed !== undefined) {
    return failed;
  }
  return agentOk({count: updates.length});
}

export async function deleteAllAgentFpTransactions(request: Request, input: unknown): Promise<AgentResult<{readonly podId: string}>> {
  const parsed = safeParseSchema(agentPodIdSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.CREATE, FpResource.DELETE_ALL));
  if (!ctx.ok) {
    return ctx;
  }
  const removed = await ctx.data.supabase.rpc('delete_agent_all_fp_transactions', {p_pod_id: parsed.value.podId});
  const removedErr = rpcErr(removed.error);
  if (removedErr !== undefined) {
    return removedErr;
  }
  return agentOk({podId: parsed.value.podId});
}

export async function createAgentFpBillSplit(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentFpBillSplitSchema, input);
  if (!parsed.ok || parsed.value.portionCount === undefined || parsed.value.startDate === undefined) {
    return agentValidation(parsed.ok ? 'Portion count and start date are required' : parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.CREATE, FpResource.BILL_SPLIT));
  if (!ctx.ok) {
    return ctx;
  }
  const parentRow = await ctx.data.supabase.from('fp_transaction').select(FP_TX_COLUMNS).eq('id', parsed.value.parentId).eq('pod_id', parsed.value.podId).maybeSingle();
  const parentErr = dbErr(parentRow.error);
  if (parentErr !== undefined) {
    return parentErr;
  }
  if (parentRow.data === null) {
    return agentErr(404, 'not_found', 'Not found');
  }
  const parent = mapDbFpTransaction(parentRow.data);
  if (parent.parentId !== undefined) {
    return agentValidation('cannot split a child');
  }
  const existing = await ctx.data.supabase.from('fp_transaction').select('id').eq('parent_id', parsed.value.parentId);
  const existingErr = dbErr(existing.error);
  if (existingErr !== undefined) {
    return existingErr;
  }
  if ((existing.data ?? []).length > 0) {
    return agentValidation('parent already has children');
  }
  const children = createFpSplitChildren(parent.amount, parsed.value.startDate, parsed.value.portionCount, FpSplitRecurrence.MONTHLY);
  if (children.length === 0) {
    return agentValidation('invalid split');
  }
  const inserted = await ctx.data.supabase.from('fp_transaction').insert(
    children.map((child) => ({
      pod_id: parent.podId,
      account_id: parent.accountId,
      posted_date: child.postedDate,
      amount: child.amount,
      description: parent.description,
      recipient: parent.recipient,
      notes: parent.notes,
      category_id: parent.categoryId ?? null,
      confirmed: true,
      parent_id: parent.id,
      created_by: ctx.data.record.ownerUserId,
    })),
  );
  const insertedErr = dbErr(inserted.error);
  if (insertedErr !== undefined) {
    return insertedErr;
  }
  const updated = await ctx.data.supabase
    .from('fp_transaction')
    .update({split_portion_count: parsed.value.portionCount, split_recurrence: FpSplitRecurrence.MONTHLY})
    .eq('id', parsed.value.parentId);
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  return agentOk({id: parsed.value.parentId});
}

export async function deleteAgentFpBillSplit(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentFpBillSplitSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.DELETE, FpResource.BILL_SPLIT));
  if (!ctx.ok) {
    return ctx;
  }
  const exists = await ownedFpRow(ctx.data, 'fp_transaction', parsed.value.parentId, parsed.value.podId);
  if (!exists.ok) {
    return exists;
  }
  const removed = await ctx.data.supabase.from('fp_transaction').delete().eq('parent_id', parsed.value.parentId).eq('pod_id', parsed.value.podId);
  const removedErr = dbErr(removed.error);
  if (removedErr !== undefined) {
    return removedErr;
  }
  const updated = await ctx.data.supabase
    .from('fp_transaction')
    .update({split_portion_count: null, split_recurrence: null})
    .eq('id', parsed.value.parentId)
    .eq('pod_id', parsed.value.podId);
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  return agentOk({id: parsed.value.parentId});
}
