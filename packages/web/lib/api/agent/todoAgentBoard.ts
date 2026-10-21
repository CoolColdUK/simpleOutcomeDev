import {
  agentTodoColumnArchiveSchema,
  agentTodoReorderCardsSchema,
  agentTodoReorderColumnsSchema,
  ApiKeyAction,
  ApiKeyResource,
  safeParseSchema,
} from '@so/model';
import {agentErr, agentOk, agentValidation, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';

export async function reorderAgentTodoColumns(request: Request, input: unknown): Promise<AgentResult<{readonly count: number}>> {
  const parsed = safeParseSchema(agentTodoReorderColumnsSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
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
  const found = await ctx.data.supabase.from('todo_column').select('id').eq('pod_id', parsed.value.podId).in('id', [...parsed.value.orderedIds]);
  const foundErr = dbErr(found.error);
  if (foundErr !== undefined) {
    return foundErr;
  }
  if ((found.data ?? []).length !== parsed.value.orderedIds.length) {
    return agentErr(400, 'validation', 'Every column must belong to this pod');
  }
  const updates = await Promise.all(
    parsed.value.orderedIds.map((id, index) =>
      ctx.data.supabase.from('todo_column').update({sort_order: index}).eq('id', id).eq('pod_id', parsed.value.podId),
    ),
  );
  const failed = updates.map((item) => dbErr(item.error)).find((item) => item !== undefined);
  if (failed !== undefined) {
    return failed;
  }
  return agentOk({count: parsed.value.orderedIds.length});
}

export async function reorderAgentTodoCards(request: Request, input: unknown): Promise<AgentResult<{readonly count: number}>> {
  const parsed = safeParseSchema(agentTodoReorderCardsSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.TODO,
    action: ApiKeyAction.UPDATE,
    todoTarget: 'card',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const ids = parsed.value.items.map((item) => item.id);
  const found = await ctx.data.supabase.from('todo_card').select('id').eq('pod_id', parsed.value.podId).in('id', ids);
  const foundErr = dbErr(found.error);
  if (foundErr !== undefined) {
    return foundErr;
  }
  if ((found.data ?? []).length !== ids.length) {
    return agentErr(400, 'validation', 'Every card must belong to this pod');
  }
  const columnIds = [...new Set(parsed.value.items.flatMap((item) => (item.columnId === null ? [] : [item.columnId])))];
  if (columnIds.length > 0) {
    const columns = await ctx.data.supabase.from('todo_column').select('id').eq('pod_id', parsed.value.podId).in('id', columnIds);
    const columnsErr = dbErr(columns.error);
    if (columnsErr !== undefined) {
      return columnsErr;
    }
    if ((columns.data ?? []).length !== columnIds.length) {
      return agentErr(404, 'not_found', 'Column not found');
    }
  }
  const updates = await Promise.all(
    parsed.value.items.map((item) =>
      ctx.data.supabase
        .from('todo_card')
        .update({column_id: item.columnId, sort_order: item.sortOrder})
        .eq('id', item.id)
        .eq('pod_id', parsed.value.podId),
    ),
  );
  const failed = updates.map((item) => dbErr(item.error)).find((item) => item !== undefined);
  if (failed !== undefined) {
    return failed;
  }
  return agentOk({count: parsed.value.items.length});
}

async function archiveColumn(request: Request, input: unknown, completedOnly: boolean): Promise<AgentResult<{readonly columnId: string}>> {
  const parsed = safeParseSchema(agentTodoColumnArchiveSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.TODO,
    action: ApiKeyAction.UPDATE,
    todoTarget: 'card',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const column = await ctx.data.supabase
    .from('todo_column')
    .select('id')
    .eq('id', parsed.value.columnId)
    .eq('pod_id', parsed.value.podId)
    .maybeSingle();
  const columnErr = dbErr(column.error);
  if (columnErr !== undefined) {
    return columnErr;
  }
  if (column.data === null) {
    return agentErr(404, 'not_found', 'Column not found');
  }
  const query = ctx.data.supabase.from('todo_card').update({column_id: null}).eq('column_id', parsed.value.columnId).eq('pod_id', parsed.value.podId);
  const updated = await (completedOnly ? query.not('completed_at', 'is', null) : query);
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  return agentOk({columnId: parsed.value.columnId});
}

export function archiveAgentTodoColumnCards(request: Request, input: unknown): Promise<AgentResult<{readonly columnId: string}>> {
  return archiveColumn(request, input, false);
}

export function archiveAgentTodoColumnCompleted(request: Request, input: unknown): Promise<AgentResult<{readonly columnId: string}>> {
  return archiveColumn(request, input, true);
}
