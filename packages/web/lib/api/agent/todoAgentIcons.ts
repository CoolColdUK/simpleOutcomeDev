import {
  agentTodoCardIconSchema,
  agentTodoIdSchema,
  ApiKeyAction,
  ApiKeyResource,
  BUCKET_POD_PRIVATE,
  buildTodoCardIconObjectPath,
  normalizeTodoImageMimeFromBlobType,
  safeParseSchema,
  TODO_MAX_ICON_BYTES,
} from '@so/model';
import {agentErr, agentOk, agentValidation, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent, type AgentContext} from '@/lib/api/agent/loadAgentContext';

function iconPrefix(podId: string, cardId: string): string {
  return `${podId}/${cardId}/`;
}

async function currentIcon(ctx: AgentContext, podId: string, cardId: string): Promise<AgentResult<string | undefined>> {
  const card = await ctx.supabase.from('todo_card').select('icon_path').eq('id', cardId).eq('pod_id', podId).maybeSingle();
  const cardErr = dbErr(card.error);
  if (cardErr !== undefined) {
    return cardErr;
  }
  if (card.data === null) {
    return agentErr(404, 'not_found', 'Card not found');
  }
  return agentOk(card.data.icon_path ?? undefined);
}

async function removeIcon(ctx: AgentContext, path: string | undefined): Promise<void> {
  if (path === undefined) {
    return;
  }
  await ctx.supabase.storage.from(BUCKET_POD_PRIVATE).remove([path]);
}

export async function replaceAgentTodoCardIcon(request: Request, input: unknown): Promise<AgentResult<{readonly iconPath: string}>> {
  const parsed = safeParseSchema(agentTodoCardIconSchema, input);
  if (!parsed.ok) {
    return agentValidation(parsed.message);
  }
  const mime = normalizeTodoImageMimeFromBlobType(parsed.value.contentType === 'image/jpg' ? 'image/jpeg' : parsed.value.contentType);
  if (mime === undefined) {
    return agentValidation('Only JPEG or PNG images are supported.');
  }
  const bytes = Buffer.from(parsed.value.contentBase64, 'base64');
  if (bytes.length === 0 || bytes.length > TODO_MAX_ICON_BYTES) {
    return agentValidation('Icon must be 5MB or smaller.');
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
  const previous = await currentIcon(ctx.data, parsed.value.podId, parsed.value.cardId);
  if (!previous.ok) {
    return previous;
  }
  const objectPath = buildTodoCardIconObjectPath(parsed.value.podId, parsed.value.cardId, mime);
  const uploaded = await ctx.data.supabase.storage.from(BUCKET_POD_PRIVATE).upload(objectPath, bytes, {contentType: mime, upsert: false});
  if (uploaded.error !== null) {
    return dbErr(uploaded.error) ?? agentErr(500, 'error', 'Request failed');
  }
  const updated = await ctx.data.supabase
    .from('todo_card')
    .update({icon_path: objectPath})
    .eq('id', parsed.value.cardId)
    .eq('pod_id', parsed.value.podId);
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    await removeIcon(ctx.data, objectPath);
    return updatedErr;
  }
  if (previous.data !== undefined && previous.data !== objectPath && previous.data.startsWith(iconPrefix(parsed.value.podId, parsed.value.cardId))) {
    await removeIcon(ctx.data, previous.data);
  }
  return agentOk({iconPath: objectPath});
}

export async function clearAgentTodoCardIcon(request: Request, input: unknown): Promise<AgentResult<{readonly id: string}>> {
  const parsed = safeParseSchema(agentTodoIdSchema, input);
  if (!parsed.ok || parsed.value.cardId === undefined) {
    return agentValidation(parsed.ok ? 'Card is required' : parsed.message);
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
  const previous = await currentIcon(ctx.data, parsed.value.podId, parsed.value.cardId);
  if (!previous.ok) {
    return previous;
  }
  const updated = await ctx.data.supabase
    .from('todo_card')
    .update({icon_path: null})
    .eq('id', parsed.value.cardId)
    .eq('pod_id', parsed.value.podId);
  const updatedErr = dbErr(updated.error);
  if (updatedErr !== undefined) {
    return updatedErr;
  }
  if (previous.data !== undefined && previous.data.startsWith(iconPrefix(parsed.value.podId, parsed.value.cardId))) {
    await removeIcon(ctx.data, previous.data);
  }
  return agentOk({id: parsed.value.cardId});
}

export async function signTodoCardIcons(
  ctx: AgentContext,
  paths: readonly (string | undefined)[],
): Promise<AgentResult<Readonly<Record<string, string>>>> {
  const unique = [...new Set(paths.filter((path): path is string => path !== undefined && path !== ''))];
  if (unique.length === 0) {
    return agentOk({});
  }
  const signed = await ctx.supabase.storage.from(BUCKET_POD_PRIVATE).createSignedUrls(unique, 60 * 60);
  if (signed.error !== null) {
    return dbErr(signed.error) ?? agentErr(500, 'error', 'Request failed');
  }
  return agentOk(
    Object.fromEntries(
      (signed.data ?? []).flatMap((row) =>
        row.error !== null || row.path === null || row.signedUrl === null || row.signedUrl === '' ? [] : [[row.path, row.signedUrl]],
      ),
    ),
  );
}
