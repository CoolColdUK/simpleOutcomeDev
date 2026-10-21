import {
  agentTodoCommentCreateSchema,
  agentTodoCommentUpdateSchema,
  agentTodoIdSchema,
  ApiKeyAction,
  ApiKeyResource,
  authorizeApiKeyCall,
  parseApiPage,
  safeParseSchema,
} from '@so/model';
import {agentErr, agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent, type AgentContext} from '@/lib/api/agent/loadAgentContext';

export interface AgentTodoComment {
  readonly id: string;
  readonly podId: string;
  readonly cardId: string;
  readonly body: string;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

function validation(message: string): AgentResult<never> {
  return agentErr(400, 'validation', message);
}

async function cardInPod(ctx: AgentContext, podId: string, cardId: string): Promise<AgentResult<true>> {
  const card = await ctx.supabase.from('todo_card').select('id').eq('id', cardId).eq('pod_id', podId).maybeSingle();
  const cardErr = dbErr(card.error);
  if (cardErr !== undefined) {
    return cardErr;
  }
  if (card.data === null) {
    return agentErr(404, 'not_found', 'Card not found');
  }
  return agentOk(true);
}

export async function listAgentTodoComments(
  request: Request,
  input: unknown,
): Promise<AgentResult<{readonly comments: readonly AgentTodoComment[]}>> {
  const parsed = safeParseSchema(agentTodoIdSchema, input);
  if (!parsed.ok || parsed.value.cardId === undefined) {
    return validation(parsed.ok ? 'Card is required' : parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.TODO,
    action: ApiKeyAction.READ,
    todoTarget: 'comment',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const card = await cardInPod(ctx.data, parsed.value.podId, parsed.value.cardId);
  if (!card.ok) {
    return card;
  }
  const page = parseApiPage(parsed.value.limit, parsed.value.offset);
  const listed = await ctx.data.supabase
    .from('todo_card_comment')
    .select('id, pod_id, card_id, body, created_by, created_at, updated_at')
    .eq('pod_id', parsed.value.podId)
    .eq('card_id', parsed.value.cardId)
    .order('created_at', {ascending: true})
    .range(page.offset, page.offset + page.limit - 1);
  const listedErr = dbErr(listed.error);
  if (listedErr !== undefined) {
    return listedErr;
  }
  return agentOk({
    comments: (listed.data ?? []).map((row) => ({
      id: row.id,
      podId: row.pod_id,
      cardId: row.card_id,
      body: row.body,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  });
}

export async function createAgentTodoComment(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentTodoCommentCreateSchema, input);
  if (!parsed.ok) {
    return validation(parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.TODO,
    action: ApiKeyAction.CREATE,
    todoTarget: 'comment',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const card = await cardInPod(ctx.data, parsed.value.podId, parsed.value.cardId);
  if (!card.ok) {
    return card;
  }
  const inserted = await ctx.data.supabase
    .from('todo_card_comment')
    .insert({
      pod_id: parsed.value.podId,
      card_id: parsed.value.cardId,
      body: parsed.value.body,
      created_by: ctx.data.record.ownerUserId,
    })
    .select('id')
    .single();
  const insertedErr = dbErr(inserted.error);
  if (insertedErr !== undefined || inserted.data === null) {
    return insertedErr ?? agentErr(500, 'error', 'Request failed');
  }
  return agentOk({id: inserted.data.id});
}

export async function updateAgentTodoComment(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentTodoCommentUpdateSchema, input);
  if (!parsed.ok) {
    return validation(parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.TODO,
    action: ApiKeyAction.UPDATE,
    todoTarget: 'comment',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const current = await ctx.data.supabase
    .from('todo_card_comment')
    .select('id, created_by')
    .eq('id', parsed.value.commentId)
    .eq('card_id', parsed.value.cardId)
    .eq('pod_id', parsed.value.podId)
    .maybeSingle();
  const currentErr = dbErr(current.error);
  if (currentErr !== undefined) {
    return currentErr;
  }
  if (current.data === null) {
    return agentErr(404, 'not_found', 'Comment not found');
  }
  if (current.data.created_by !== ctx.data.record.ownerUserId) {
    return agentErr(403, 'forbidden', 'You can only edit your own comment');
  }
  const updated = await ctx.data.supabase.from('todo_card_comment').update({body: parsed.value.body}).eq('id', parsed.value.commentId);
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  return agentOk({id: parsed.value.commentId});
}

export async function deleteAgentTodoComment(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentTodoIdSchema, input);
  if (!parsed.ok || parsed.value.cardId === undefined || parsed.value.commentId === undefined) {
    return validation(parsed.ok ? 'Comment is required' : parsed.message);
  }
  const ctx = await requirePodAgent(request, {
    podId: parsed.value.podId,
    resource: ApiKeyResource.TODO,
    action: ApiKeyAction.DELETE,
    todoTarget: 'comment',
  });
  if (!ctx.ok) {
    return ctx;
  }
  const current = await ctx.data.supabase
    .from('todo_card_comment')
    .select('id, created_by')
    .eq('id', parsed.value.commentId)
    .eq('card_id', parsed.value.cardId)
    .eq('pod_id', parsed.value.podId)
    .maybeSingle();
  const currentErr = dbErr(current.error);
  if (currentErr !== undefined) {
    return currentErr;
  }
  if (current.data === null) {
    return agentErr(404, 'not_found', 'Comment not found');
  }
  if (current.data.created_by !== ctx.data.record.ownerUserId) {
    const manager = authorizeApiKeyCall({
      key: ctx.data.record,
      access: ctx.data.access,
      nowIso: ctx.data.nowIso,
      call: {
        spaceId: ctx.data.spaceId,
        podId: parsed.value.podId,
        resource: ApiKeyResource.TODO,
        action: ApiKeyAction.DELETE,
        todoTarget: 'column',
      },
    });
    if (!manager.ok) {
      return agentErr(403, 'forbidden', 'You can only delete your own comment');
    }
  }
  const removed = await ctx.data.supabase.from('todo_card_comment').delete().eq('id', parsed.value.commentId).select('id');
  const removedErr = dbErr(removed.error);
  if (removedErr !== undefined) {
    return removedErr;
  }
  return agentOk({id: parsed.value.commentId});
}
