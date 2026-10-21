import {agentTodoColumnCreateSchema, agentTodoColumnUpdateSchema, agentTodoIdSchema, ApiKeyAction, ApiKeyResource, parseApiPage, safeParseSchema} from '@so/model';
import {agentErr, agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent, type AgentContext} from '@/lib/api/agent/loadAgentContext';

export interface AgentTodoColumn {
  readonly id: string;
  readonly podId: string;
  readonly title: string;
  readonly sortOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

function validation(message: string): AgentResult<never> {
  return agentErr(400, 'validation', message);
}

export async function listAgentTodoColumns(request: Request, input: unknown): Promise<AgentResult<{readonly columns: readonly AgentTodoColumn[]}>> {
  const parsed = safeParseSchema(agentTodoIdSchema, input);
  if (!parsed.ok) {
    return validation(parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.TODO,
    action: ApiKeyAction.READ,
    todoTarget: 'column',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const page = parseApiPage(parsed.value.limit, parsed.value.offset);
  const listed = await ctx.data.supabase
    .from('todo_column')
    .select('id, pod_id, title, sort_order, created_at, updated_at')
    .eq('pod_id', parsed.value.podId)
    .order('sort_order', {ascending: true})
    .order('created_at', {ascending: true})
    .range(page.offset, page.offset + page.limit - 1);
  const listedErr = dbErr(listed.error);
  if (listedErr !== undefined) {
    return listedErr;
  }
  return agentOk({
    columns: (listed.data ?? []).map((row) => ({
      id: row.id,
      podId: row.pod_id,
      title: row.title,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  });
}

async function nextColumnSort(ctx: AgentContext, podId: string): Promise<AgentResult<number>> {
  const existing = await ctx.supabase.from('todo_column').select('sort_order').eq('pod_id', podId).order('sort_order', {ascending: false}).limit(1);
  const existingErr = dbErr(existing.error);
  if (existingErr !== undefined) {
    return existingErr;
  }
  return agentOk((existing.data?.[0]?.sort_order ?? -1) + 1);
}

export async function createAgentTodoColumn(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentTodoColumnCreateSchema, input);
  if (!parsed.ok) {
    return validation(parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.TODO,
    action: ApiKeyAction.CREATE,
    todoTarget: 'column',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const sort = parsed.value.sortOrder === undefined ? await nextColumnSort(ctx.data, parsed.value.podId) : agentOk(parsed.value.sortOrder);
  if (!sort.ok) {
    return sort;
  }
  const inserted = await ctx.data.supabase
    .from('todo_column')
    .insert({pod_id: parsed.value.podId, title: parsed.value.title, sort_order: sort.data})
    .select('id')
    .single();
  const insertedErr = dbErr(inserted.error);
  if (insertedErr !== undefined || inserted.data === null) {
    return insertedErr ?? agentErr(500, 'error', 'Request failed');
  }
  return agentOk({id: inserted.data.id});
}

export async function updateAgentTodoColumn(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentTodoColumnUpdateSchema, input);
  if (!parsed.ok) {
    return validation(parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.TODO,
    action: ApiKeyAction.UPDATE,
    todoTarget: 'column',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const patch = {
    ...(parsed.value.title === undefined ? {} : {title: parsed.value.title}),
    ...(parsed.value.sortOrder === undefined ? {} : {sort_order: parsed.value.sortOrder}),
  };
  const updated = await ctx.data.supabase
    .from('todo_column')
    .update(patch)
    .eq('id', parsed.value.columnId)
    .eq('pod_id', parsed.value.podId)
    .select('id');
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  if ((updated.data ?? []).length === 0) {
    return agentErr(404, 'not_found', 'Column not found');
  }
  return agentOk({id: parsed.value.columnId});
}

export async function deleteAgentTodoColumn(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentTodoIdSchema, input);
  if (!parsed.ok || parsed.value.columnId === undefined) {
    return validation(parsed.ok ? 'Column is required' : parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.TODO,
    action: ApiKeyAction.DELETE,
    todoTarget: 'column',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const removed = await ctx.data.supabase.from('todo_column').delete().eq('id', parsed.value.columnId).eq('pod_id', parsed.value.podId).select('id');
  const removedErr = dbErr(removed.error);
  if (removedErr !== undefined) {
    return removedErr;
  }
  if ((removed.data ?? []).length === 0) {
    return agentErr(404, 'not_found', 'Column not found');
  }
  return agentOk({id: parsed.value.columnId});
}
