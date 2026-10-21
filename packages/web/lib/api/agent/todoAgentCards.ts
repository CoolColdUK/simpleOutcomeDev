import {
  agentTodoCardCreateSchema,
  agentTodoCardUpdateSchema,
  agentTodoIdSchema,
  ApiKeyAction,
  ApiKeyResource,
  parseApiPage,
  safeParseSchema,
} from '@so/model';
import {agentErr, agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent, type AgentContext} from '@/lib/api/agent/loadAgentContext';
import {mapDbTodoCard, type DbTodoCard} from '@/lib/api/db/mapDbTodoCard';

function validation(message: string): AgentResult<never> {
  return agentErr(400, 'validation', message);
}

export async function listAgentTodoCards(request: Request, input: unknown): Promise<AgentResult<{readonly cards: readonly DbTodoCard[]}>> {
  const parsed = safeParseSchema(agentTodoIdSchema, input);
  if (!parsed.ok) {
    return validation(parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.TODO,
    action: ApiKeyAction.READ,
    todoTarget: 'card',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const page = parseApiPage(parsed.value.limit, parsed.value.offset);
  const query = ctx.data.supabase
    .from('todo_card')
    .select(
      'id, pod_id, column_id, title, description, due_at, tags, assignee_user_id, sort_order, completed_at, icon_path, created_by, created_at, updated_at',
    )
    .eq('pod_id', parsed.value.podId)
    .order('sort_order', {ascending: true})
    .order('created_at', {ascending: true});
  const filtered = parsed.value.tag === undefined ? query : query.contains('tags', [parsed.value.tag]);
  const listed = await filtered.range(page.offset, page.offset + page.limit - 1);
  const listedErr = dbErr(listed.error);
  if (listedErr !== undefined) {
    return listedErr;
  }
  return agentOk({cards: (listed.data ?? []).map(mapDbTodoCard)});
}

export async function createAgentTodoCard(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentTodoCardCreateSchema, input);
  if (!parsed.ok) {
    return validation(parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.TODO,
    action: ApiKeyAction.CREATE,
    todoTarget: 'card',
  });
  if (!ctx.ok) {
    return ctx;
  }
  return insertTodoCard(ctx.data, parsed.value);
}

async function insertTodoCard(
  ctx: AgentContext,
  input: {
    readonly podId: string;
    readonly title: string;
    readonly columnId: string;
    readonly description?: string;
    readonly tags?: readonly string[];
    readonly dueAt?: string | null;
    readonly sortOrder?: number;
  },
): Promise<AgentResult<{readonly id: string}>> {
  const column = await ctx.supabase.from('todo_column').select('id').eq('id', input.columnId).eq('pod_id', input.podId).maybeSingle();
  const columnErr = dbErr(column.error);
  if (columnErr !== undefined) {
    return columnErr;
  }
  if (column.data === null) {
    return agentErr(404, 'not_found', 'Column not found');
  }
  const existing = await ctx.supabase
    .from('todo_card')
    .select('sort_order')
    .eq('pod_id', input.podId)
    .order('sort_order', {ascending: false})
    .limit(1);
  const existingErr = dbErr(existing.error);
  if (existingErr !== undefined) {
    return existingErr;
  }
  const sortOrder = input.sortOrder ?? (existing.data?.[0]?.sort_order ?? -1) + 1;
  const inserted = await ctx.supabase
    .from('todo_card')
    .insert({
      pod_id: input.podId,
      column_id: input.columnId,
      title: input.title,
      description: input.description ?? '',
      tags: input.tags === undefined ? [] : [...input.tags],
      due_at: input.dueAt ?? null,
      sort_order: sortOrder,
      created_by: ctx.record.ownerUserId,
    })
    .select('id')
    .single();
  const insertedErr = dbErr(inserted.error);
  if (insertedErr !== undefined || inserted.data === null) {
    return insertedErr ?? agentErr(500, 'error', 'Request failed');
  }
  return agentOk({id: inserted.data.id});
}

export async function updateAgentTodoCard(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentTodoCardUpdateSchema, input);
  if (!parsed.ok) {
    return validation(parsed.message);
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
  const current = await ctx.data.supabase.from('todo_card').select('id').eq('id', parsed.value.cardId).eq('pod_id', parsed.value.podId).maybeSingle();
  const currentErr = dbErr(current.error);
  if (currentErr !== undefined) {
    return currentErr;
  }
  if (current.data === null) {
    return agentErr(404, 'not_found', 'Card not found');
  }
  if (parsed.value.columnId !== undefined && parsed.value.columnId !== null) {
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
  }
  const patch = {
    ...(parsed.value.title === undefined ? {} : {title: parsed.value.title}),
    ...(parsed.value.description === undefined ? {} : {description: parsed.value.description}),
    ...(parsed.value.tags === undefined ? {} : {tags: [...parsed.value.tags]}),
    ...(parsed.value.dueAt === undefined ? {} : {due_at: parsed.value.dueAt}),
    ...(parsed.value.sortOrder === undefined ? {} : {sort_order: parsed.value.sortOrder}),
    ...(parsed.value.completedAt === undefined ? {} : {completed_at: parsed.value.completedAt}),
    ...(parsed.value.columnId === undefined ? {} : {column_id: parsed.value.columnId}),
  };
  const updated = await ctx.data.supabase.from('todo_card').update(patch).eq('id', parsed.value.cardId).eq('pod_id', parsed.value.podId);
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  return agentOk({id: parsed.value.cardId});
}

export async function deleteAgentTodoCard(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentTodoIdSchema, input);
  if (!parsed.ok || parsed.value.cardId === undefined) {
    return validation(parsed.ok ? 'Card is required' : parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.TODO,
    action: ApiKeyAction.DELETE,
    todoTarget: 'card',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const removed = await ctx.data.supabase.from('todo_card').delete().eq('id', parsed.value.cardId).eq('pod_id', parsed.value.podId).select('id');
  const removedErr = dbErr(removed.error);
  if (removedErr !== undefined) {
    return removedErr;
  }
  if ((removed.data ?? []).length === 0) {
    return agentErr(404, 'not_found', 'Card not found');
  }
  return agentOk({id: parsed.value.cardId});
}
