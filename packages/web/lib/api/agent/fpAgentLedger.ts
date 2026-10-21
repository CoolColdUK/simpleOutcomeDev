import {
  agentFpAccountCreateSchema,
  agentFpAccountUpdateSchema,
  agentFpCategoryWriteSchema,
  agentPodIdSchema,
  ApiKeyAction,
  FpResource,
  safeParseSchema,
} from '@so/model';
import {agentErr, agentOk, agentValidation, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {fpCall, ownedFpRow} from '@/lib/api/agent/fpAgentCall';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {mapDbFpAccount} from '@/lib/api/db/mapDbFpAccount';
import {mapDbFpCategory} from '@/lib/api/db/mapDbFpCategory';

export async function listAgentFpAccounts(request: Request, input: unknown): Promise<AgentResult<{readonly accounts: readonly unknown[]}>> {
  const parsed = safeParseSchema(agentPodIdSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.READ, FpResource.ACCOUNT));
  if (!ctx.ok) {
    return ctx;
  }
  const accounts = await ctx.data.supabase
    .from('fp_account')
    .select('id, pod_id, name, kind, opening_fund, archived, notes')
    .eq('pod_id', parsed.value.podId)
    .order('name', {ascending: true});
  const accountsErr = dbErr(accounts.error);
  if (accountsErr !== undefined) {
    return accountsErr;
  }
  const totals = await ctx.data.supabase
    .from('fp_transaction')
    .select('account_id, amount')
    .eq('pod_id', parsed.value.podId)
    .eq('archived', false)
    .is('parent_id', null);
  const totalsErr = dbErr(totals.error);
  if (totalsErr !== undefined) {
    return totalsErr;
  }
  const byAccount = (totals.data ?? []).reduce((sum, row) => {
    sum.set(row.account_id, (sum.get(row.account_id) ?? 0) + Number(row.amount));
    return sum;
  }, new Map<string, number>());
  return agentOk({
    accounts: (accounts.data ?? []).map((row) => {
      const account = mapDbFpAccount(row);
      return {...account, balance: account.openingFund + (byAccount.get(account.id) ?? 0)};
    }),
  });
}

export async function createAgentFpAccount(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentFpAccountCreateSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.CREATE, FpResource.ACCOUNT));
  if (!ctx.ok) {
    return ctx;
  }
  const inserted = await ctx.data.supabase
    .from('fp_account')
    .insert({
      pod_id: parsed.value.podId,
      name: parsed.value.name,
      kind: parsed.value.kind,
      opening_fund: parsed.value.openingFund ?? 0,
      notes: parsed.value.notes ?? null,
    })
    .select('id')
    .single();
  const insertedErr = dbErr(inserted.error);
  if (insertedErr !== undefined || inserted.data === null) {
    return insertedErr ?? agentErr(500, 'error', 'Request failed');
  }
  return agentOk({id: inserted.data.id});
}

export async function updateAgentFpAccount(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentFpAccountUpdateSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.UPDATE, FpResource.ACCOUNT));
  if (!ctx.ok) {
    return ctx;
  }
  const exists = await ownedFpRow(ctx.data, 'fp_account', parsed.value.accountId, parsed.value.podId);
  if (!exists.ok) {
    return exists;
  }
  const patch = {
    ...(parsed.value.name === undefined ? {} : {name: parsed.value.name}),
    ...(parsed.value.kind === undefined ? {} : {kind: parsed.value.kind}),
    ...(parsed.value.openingFund === undefined ? {} : {opening_fund: parsed.value.openingFund}),
    ...(parsed.value.archived === undefined ? {} : {archived: parsed.value.archived}),
    ...(parsed.value.notes === undefined ? {} : {notes: parsed.value.notes === null || parsed.value.notes === '' ? null : parsed.value.notes}),
  };
  const updated = await ctx.data.supabase.from('fp_account').update(patch).eq('id', parsed.value.accountId).eq('pod_id', parsed.value.podId);
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  return agentOk({id: parsed.value.accountId});
}

export async function deleteAgentFpAccount(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentFpAccountUpdateSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.DELETE, FpResource.ACCOUNT));
  if (!ctx.ok) {
    return ctx;
  }
  const removed = await ctx.data.supabase.from('fp_account').delete().eq('id', parsed.value.accountId).eq('pod_id', parsed.value.podId).select('id');
  const removedErr = dbErr(removed.error);
  if (removedErr !== undefined) {
    return removedErr;
  }
  if ((removed.data ?? []).length === 0) {
    return agentErr(404, 'not_found', 'Not found');
  }
  return agentOk({id: parsed.value.accountId});
}

export async function listAgentFpCategories(request: Request, input: unknown): Promise<AgentResult<{readonly categories: readonly unknown[]}>> {
  const parsed = safeParseSchema(agentPodIdSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.READ, FpResource.CATEGORY));
  if (!ctx.ok) {
    return ctx;
  }
  const rows = await ctx.data.supabase
    .from('fp_category')
    .select('id, pod_id, name, direction, budget_amount, budget_period, favourite, sort_order, colour, filters, is_group, parent_id')
    .eq('pod_id', parsed.value.podId)
    .order('sort_order', {ascending: true})
    .order('name', {ascending: true});
  const rowsErr = dbErr(rows.error);
  if (rowsErr !== undefined) {
    return rowsErr;
  }
  return agentOk({categories: (rows.data ?? []).map(mapDbFpCategory)});
}

export async function createAgentFpCategory(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentFpCategoryWriteSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  if (parsed.value.name === undefined || parsed.value.direction === undefined) {
    return agentValidation('Name and direction are required');
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.CREATE, FpResource.CATEGORY));
  if (!ctx.ok) {
    return ctx;
  }
  const isGroup = parsed.value.isGroup === true;
  if (isGroup && parsed.value.parentId !== undefined && parsed.value.parentId !== null) {
    return agentValidation('group categories cannot have a parent');
  }
  const inserted = await ctx.data.supabase
    .from('fp_category')
    .insert({
      pod_id: parsed.value.podId,
      name: parsed.value.name,
      direction: parsed.value.direction,
      budget_amount: isGroup ? null : parsed.value.budgetAmount ?? null,
      budget_period: isGroup ? null : parsed.value.budgetPeriod ?? null,
      favourite: parsed.value.favourite ?? false,
      filters: isGroup ? [] : [...(parsed.value.filters ?? [])],
      is_group: isGroup,
      parent_id: isGroup ? null : parsed.value.parentId ?? null,
      sort_order: parsed.value.sortOrder,
    })
    .select('id')
    .single();
  const insertedErr = dbErr(inserted.error);
  if (insertedErr !== undefined || inserted.data === null) {
    return insertedErr ?? agentErr(500, 'error', 'Request failed');
  }
  return agentOk({id: inserted.data.id});
}

export async function updateAgentFpCategory(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentFpCategoryWriteSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const categoryId = parsed.value.categoryId;
  if (categoryId === undefined) {
    return agentValidation('Category is required');
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.UPDATE, FpResource.CATEGORY));
  if (!ctx.ok) {
    return ctx;
  }
  const exists = await ownedFpRow(ctx.data, 'fp_category', categoryId, parsed.value.podId);
  if (!exists.ok) {
    return exists;
  }
  const value = parsed.value;
  const groupPatch =
    value.isGroup === true
      ? {is_group: true, parent_id: null, budget_amount: null, budget_period: null, filters: []}
      : {
          ...(value.isGroup === false ? {is_group: false} : {}),
          ...(value.clearBudget === true
            ? {budget_amount: null, budget_period: null}
            : {
                ...(value.budgetAmount === undefined ? {} : {budget_amount: value.budgetAmount}),
                ...(value.budgetPeriod === undefined ? {} : {budget_period: value.budgetPeriod}),
              }),
          ...(value.filters === undefined ? {} : {filters: [...value.filters]}),
          ...(value.clearParent === true ? {parent_id: null} : value.parentId === undefined ? {} : {parent_id: value.parentId}),
        };
  const patch = {
    ...(value.name === undefined ? {} : {name: value.name}),
    ...(value.direction === undefined ? {} : {direction: value.direction}),
    ...(value.favourite === undefined ? {} : {favourite: value.favourite}),
    ...(value.sortOrder === undefined ? {} : {sort_order: value.sortOrder}),
    ...groupPatch,
  };
  const updated = await ctx.data.supabase.from('fp_category').update(patch).eq('id', categoryId).eq('pod_id', value.podId);
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  return agentOk({id: categoryId});
}

export async function deleteAgentFpCategory(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentFpCategoryWriteSchema, input);
  if (!parsed.ok || parsed.value.categoryId === undefined) {
    return agentValidation(parsed.ok ? 'Category is required' : parsed.message);
  }
  const ctx = await requirePodAgent(request, fpCall(parsed.value.podId, ApiKeyAction.DELETE, FpResource.CATEGORY));
  if (!ctx.ok) {
    return ctx;
  }
  const removed = await ctx.data.supabase
    .from('fp_category')
    .delete()
    .eq('id', parsed.value.categoryId)
    .eq('pod_id', parsed.value.podId)
    .select('id');
  const removedErr = dbErr(removed.error);
  if (removedErr !== undefined) {
    return removedErr;
  }
  if ((removed.data ?? []).length === 0) {
    return agentErr(404, 'not_found', 'Not found');
  }
  return agentOk({id: parsed.value.categoryId});
}

