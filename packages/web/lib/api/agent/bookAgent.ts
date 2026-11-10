import {ApiKeyAction, BookChapterStatus, BookOutlineKind} from '@so/model';
import {agentErr, agentOk, agentValidation, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {bookCall} from '@/lib/api/agent/bookAgentCall';
import {loadDbBookWorkspaceWithClient} from '@/lib/api/db/book/loadDbBookWorkspace';
import buildDbBookEpub from '@/lib/api/db/book/buildDbBookEpub';
import buildDbBookOfflineBundle from '@/lib/api/db/book/buildDbBookOfflineBundle';
import mapDbBkOutlineRow from '@/lib/api/db/book/mapDbBkOutlineRow';

function podIdFromArgs(args: Record<string, unknown>): string {
  return typeof args.podId === 'string' ? args.podId : '';
}

export async function getAgentBookWorkspace(request: Request, args: Record<string, unknown>): Promise<AgentResult<unknown>> {
  const podId = podIdFromArgs(args);
  if (podId === '') {
    return agentValidation('podId is required');
  }
  const ctx = await requirePodAgent(request, bookCall(podId, ApiKeyAction.READ));
  if (!ctx.ok) {
    return ctx;
  }
  const workspace = await loadDbBookWorkspaceWithClient(ctx.data.supabase, podId);
  if (workspace === undefined) {
    return agentErr(404, 'not_found', 'Book not found');
  }
  return agentOk(workspace);
}

export async function updateAgentBookMetadata(request: Request, args: Record<string, unknown>): Promise<AgentResult<unknown>> {
  const podId = podIdFromArgs(args);
  if (podId === '') {
    return agentValidation('podId is required');
  }
  const ctx = await requirePodAgent(request, bookCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) {
    return ctx;
  }
  const patch: Record<string, string | null> = {};
  if (typeof args.subtitle === 'string') {
    patch.subtitle = args.subtitle;
  }
  if (typeof args.summaryMd === 'string') {
    patch.summary_md = args.summaryMd;
  }
  if (typeof args.coverStoragePath === 'string' || args.coverStoragePath === null) {
    patch.cover_storage_path = typeof args.coverStoragePath === 'string' ? args.coverStoragePath : null;
  }
  const {error} = await ctx.data.supabase.from('bk_book').update(patch).eq('pod_id', podId);
  const err = dbErr(error);
  if (err !== undefined) {
    return err;
  }
  return getAgentBookWorkspace(request, args);
}

export async function createAgentBookOutlineEntry(request: Request, args: Record<string, unknown>): Promise<AgentResult<unknown>> {
  const podId = podIdFromArgs(args);
  const kind = args.kind === 'note' ? BookOutlineKind.NOTE : BookOutlineKind.CHAPTER;
  if (podId === '') {
    return agentValidation('podId is required');
  }
  const ctx = await requirePodAgent(request, bookCall(podId, ApiKeyAction.CREATE));
  if (!ctx.ok) {
    return ctx;
  }
  const maxRes = await ctx.data.supabase.from('bk_outline_entry').select('sort_order').eq('pod_id', podId).order('sort_order', {ascending: false}).limit(1);
  const maxErr = dbErr(maxRes.error);
  if (maxErr !== undefined) {
    return maxErr;
  }
  const sortOrder = maxRes.data?.[0] === undefined ? 0 : maxRes.data[0].sort_order + 1;
  const status = kind === BookOutlineKind.CHAPTER ? (typeof args.status === 'string' ? args.status : BookChapterStatus.OUTLINE) : null;
  const {data, error} = await ctx.data.supabase
    .from('bk_outline_entry')
    .insert({
      pod_id: podId,
      kind,
      sort_order: sortOrder,
      title: typeof args.title === 'string' ? args.title : '',
      summary_md: typeof args.summaryMd === 'string' ? args.summaryMd : '',
      content_md: typeof args.contentMd === 'string' ? args.contentMd : '',
      status,
    })
    .select('*')
    .single();
  const createErr = dbErr(error);
  if (createErr !== undefined) {
    return createErr;
  }
  if (data === null) {
    return agentErr(500, 'internal', 'Create failed');
  }
  await ctx.data.supabase.rpc('bk_renumber_outline', {p_pod_id: podId});
  return agentOk(mapDbBkOutlineRow(data));
}

export async function updateAgentBookOutlineEntry(request: Request, args: Record<string, unknown>): Promise<AgentResult<unknown>> {
  const podId = podIdFromArgs(args);
  const entryId = typeof args.entryId === 'string' ? args.entryId : '';
  if (podId === '' || entryId === '') {
    return agentValidation('podId and entryId are required');
  }
  const ctx = await requirePodAgent(request, bookCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) {
    return ctx;
  }
  const patch: Record<string, string> = {};
  if (typeof args.title === 'string') {
    patch.title = args.title;
  }
  if (typeof args.summaryMd === 'string') {
    patch.summary_md = args.summaryMd;
  }
  if (typeof args.contentMd === 'string') {
    patch.content_md = args.contentMd;
  }
  if (typeof args.status === 'string') {
    patch.status = args.status;
  }
  const {error} = await ctx.data.supabase.from('bk_outline_entry').update(patch).eq('id', entryId).eq('pod_id', podId);
  const updErr = dbErr(error);
  if (updErr !== undefined) {
    return updErr;
  }
  const row = await ctx.data.supabase.from('bk_outline_entry').select('*').eq('id', entryId).single();
  const rowErr = dbErr(row.error);
  if (rowErr !== undefined) {
    return rowErr;
  }
  if (row.data === null) {
    return agentErr(404, 'not_found', 'Not found');
  }
  return agentOk(mapDbBkOutlineRow(row.data));
}

export async function deleteAgentBookOutlineEntry(request: Request, args: Record<string, unknown>): Promise<AgentResult<unknown>> {
  const podId = podIdFromArgs(args);
  const entryId = typeof args.entryId === 'string' ? args.entryId : '';
  if (podId === '' || entryId === '') {
    return agentValidation('podId and entryId are required');
  }
  const ctx = await requirePodAgent(request, bookCall(podId, ApiKeyAction.DELETE));
  if (!ctx.ok) {
    return ctx;
  }
  const {error} = await ctx.data.supabase.from('bk_outline_entry').delete().eq('id', entryId).eq('pod_id', podId);
  const delErr = dbErr(error);
  if (delErr !== undefined) {
    return delErr;
  }
  await ctx.data.supabase.rpc('bk_renumber_outline', {p_pod_id: podId});
  return agentOk({deleted: true});
}

export async function reorderAgentBookOutline(request: Request, args: Record<string, unknown>): Promise<AgentResult<unknown>> {
  const podId = podIdFromArgs(args);
  const orderedIds = Array.isArray(args.orderedIds) ? args.orderedIds.filter((id): id is string => typeof id === 'string') : [];
  if (podId === '' || orderedIds.length === 0) {
    return agentValidation('podId and orderedIds are required');
  }
  const ctx = await requirePodAgent(request, bookCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) {
    return ctx;
  }
  await Promise.all(
    orderedIds.map((id, index) =>
      ctx.data.supabase.from('bk_outline_entry').update({sort_order: index}).eq('id', id).eq('pod_id', podId),
    ),
  );
  const {error} = await ctx.data.supabase.rpc('bk_renumber_outline', {p_pod_id: podId});
  const rpcErr = dbErr(error);
  if (rpcErr !== undefined) {
    return rpcErr;
  }
  return getAgentBookWorkspace(request, args);
}

export async function exportAgentBookEpub(request: Request, args: Record<string, unknown>): Promise<AgentResult<unknown>> {
  const podId = podIdFromArgs(args);
  if (podId === '') {
    return agentValidation('podId is required');
  }
  const ctx = await requirePodAgent(request, bookCall(podId, ApiKeyAction.READ));
  if (!ctx.ok) {
    return ctx;
  }
  const workspace = await loadDbBookWorkspaceWithClient(ctx.data.supabase, podId);
  if (workspace === undefined) {
    return agentErr(404, 'not_found', 'Book not found');
  }
  const pod = await ctx.data.supabase.from('pod').select('name').eq('id', podId).maybeSingle();
  const title = pod.data?.name ?? 'Book';
  const includeNotes = args.includeNotes === true;
  const bytes = await buildDbBookEpub(ctx.data.supabase, workspace, {title, includeNotes});
  return agentOk({contentBase64: Buffer.from(bytes).toString('base64'), mimeType: 'application/epub+zip'});
}

export async function getAgentBookOfflineBundle(request: Request, args: Record<string, unknown>): Promise<AgentResult<unknown>> {
  const podId = podIdFromArgs(args);
  if (podId === '') {
    return agentValidation('podId is required');
  }
  const ctx = await requirePodAgent(request, bookCall(podId, ApiKeyAction.READ));
  if (!ctx.ok) {
    return ctx;
  }
  const workspace = await loadDbBookWorkspaceWithClient(ctx.data.supabase, podId);
  if (workspace === undefined) {
    return agentErr(404, 'not_found', 'Book not found');
  }
  const bundle = await buildDbBookOfflineBundle(podId, workspace);
  return agentOk(bundle);
}
