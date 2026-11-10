import {ApiKeyAction, BookChapterStatus, BookOutlineKind} from '@so/model';
import {agentErr, agentOk, agentValidation, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {bookCall} from '@/lib/api/agent/bookAgentCall';
import {loadDbBookWorkspaceWithClient} from '@/lib/api/db/book/loadDbBookWorkspace';
import buildDbBookEpub from '@/lib/api/db/book/buildDbBookEpub';
import buildDbBookOfflineBundle from '@/lib/api/db/book/buildDbBookOfflineBundle';
import mapDbBkOutlineRow from '@/lib/api/db/book/mapDbBkOutlineRow';
import type {DbBookWorkspace} from '@/lib/api/db/book/loadDbBookWorkspace';
import mapBookAssetForAgent, {type AgentBookAssetPayload} from '@/lib/api/agent/mapBookAssetForAgent';

function mapBookWorkspaceForAgent(workspace: DbBookWorkspace): Omit<DbBookWorkspace, 'assets'> & {assets: AgentBookAssetPayload[]} {
  return {
    ...workspace,
    assets: workspace.assets.map(mapBookAssetForAgent),
  };
}

async function loadMappedBookAsset(
  supabase: Parameters<typeof loadDbBookWorkspaceWithClient>[0],
  podId: string,
  assetId: string,
): Promise<ReturnType<typeof mapBookAssetForAgent> | undefined> {
  const workspace = await loadDbBookWorkspaceWithClient(supabase, podId);
  const asset = workspace?.assets.find((row) => row.id === assetId);
  return asset === undefined ? undefined : mapBookAssetForAgent(asset);
}

function podIdFromArgs(args: Record<string, unknown>): string {
  return typeof args.podId === 'string' ? args.podId : '';
}

function bookArgs(args: unknown): Record<string, unknown> {
  return typeof args === 'object' && args !== null && !Array.isArray(args) ? (args as Record<string, unknown>) : {};
}

export async function getAgentBookWorkspace(request: Request, args: unknown): Promise<AgentResult<unknown>> {
  const record = bookArgs(args);
  const podId = podIdFromArgs(record);
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
  return agentOk(mapBookWorkspaceForAgent(workspace));
}

export async function updateAgentBookMetadata(request: Request, args: unknown): Promise<AgentResult<unknown>> {
  const record = bookArgs(args);
  const podId = podIdFromArgs(record);
  if (podId === '') {
    return agentValidation('podId is required');
  }
  const ctx = await requirePodAgent(request, bookCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) {
    return ctx;
  }
  const {error} = await ctx.data.supabase
    .from('bk_book')
    .update({
      ...(typeof record.subtitle === 'string' ? {subtitle: record.subtitle} : {}),
      ...(typeof record.summaryMd === 'string' ? {summary_md: record.summaryMd} : {}),
      ...(record.coverStoragePath === null
        ? {cover_storage_path: null}
        : typeof record.coverStoragePath === 'string'
          ? {cover_storage_path: record.coverStoragePath}
          : {}),
    })
    .eq('pod_id', podId);
  const err = dbErr(error);
  if (err !== undefined) {
    return err;
  }
  return getAgentBookWorkspace(request, args);
}

export async function createAgentBookOutlineEntry(request: Request, args: unknown): Promise<AgentResult<unknown>> {
  const record = bookArgs(args);
  const podId = podIdFromArgs(record);
  const kind = record.kind === 'note' ? BookOutlineKind.NOTE : BookOutlineKind.CHAPTER;
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
  const status = kind === BookOutlineKind.CHAPTER ? (typeof record.status === 'string' ? record.status : BookChapterStatus.OUTLINE) : null;
  const {data, error} = await ctx.data.supabase
    .from('bk_outline_entry')
    .insert({
      pod_id: podId,
      kind,
      sort_order: sortOrder,
      title: typeof record.title === 'string' ? record.title : '',
      summary_md: typeof record.summaryMd === 'string' ? record.summaryMd : '',
      content_md: typeof record.contentMd === 'string' ? record.contentMd : '',
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

export async function updateAgentBookOutlineEntry(request: Request, args: unknown): Promise<AgentResult<unknown>> {
  const record = bookArgs(args);
  const podId = podIdFromArgs(record);
  const entryId = typeof record.entryId === 'string' ? record.entryId : '';
  if (podId === '' || entryId === '') {
    return agentValidation('podId and entryId are required');
  }
  const ctx = await requirePodAgent(request, bookCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) {
    return ctx;
  }
  const {error} = await ctx.data.supabase
    .from('bk_outline_entry')
    .update({
      ...(typeof record.title === 'string' ? {title: record.title} : {}),
      ...(typeof record.summaryMd === 'string' ? {summary_md: record.summaryMd} : {}),
      ...(typeof record.contentMd === 'string' ? {content_md: record.contentMd} : {}),
      ...(typeof record.status === 'string' ? {status: record.status} : {}),
      ...(record.chapterImageStoragePath === null
        ? {chapter_image_storage_path: null}
        : typeof record.chapterImageStoragePath === 'string'
          ? {chapter_image_storage_path: record.chapterImageStoragePath}
          : {}),
    })
    .eq('id', entryId)
    .eq('pod_id', podId);
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

export async function deleteAgentBookOutlineEntry(request: Request, args: unknown): Promise<AgentResult<unknown>> {
  const record = bookArgs(args);
  const podId = podIdFromArgs(record);
  const entryId = typeof record.entryId === 'string' ? record.entryId : '';
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

export async function reorderAgentBookOutline(request: Request, args: unknown): Promise<AgentResult<unknown>> {
  const record = bookArgs(args);
  const podId = podIdFromArgs(record);
  const orderedIds = Array.isArray(record.orderedIds) ? record.orderedIds.filter((id): id is string => typeof id === 'string') : [];
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

export async function exportAgentBookEpub(request: Request, args: unknown): Promise<AgentResult<unknown>> {
  const record = bookArgs(args);
  const podId = podIdFromArgs(record);
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
  const exportScope =
    record.exportScope === 'chapters' || record.exportScope === 'notes' || record.exportScope === 'all'
      ? record.exportScope
      : record.includeNotes === true
        ? 'all'
        : 'chapters';
  const bytes = await buildDbBookEpub(ctx.data.supabase, workspace, {title, exportScope});
  return agentOk({contentBase64: Buffer.from(bytes).toString('base64'), mimeType: 'application/epub+zip'});
}

export async function createAgentBookAssetType(request: Request, args: unknown): Promise<AgentResult<unknown>> {
  const record = bookArgs(args);
  const podId = podIdFromArgs(record);
  const label = typeof record.label === 'string' ? record.label : '';
  const slug = typeof record.slug === 'string' ? record.slug : label.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');
  if (podId === '' || label.trim() === '' || slug === '') {
    return agentValidation('podId and label are required');
  }
  const ctx = await requirePodAgent(request, bookCall(podId, ApiKeyAction.CREATE));
  if (!ctx.ok) {
    return ctx;
  }
  const maxRes = await ctx.data.supabase.from('bk_asset_type').select('sort_order').eq('pod_id', podId).order('sort_order', {ascending: false}).limit(1);
  const maxErr = dbErr(maxRes.error);
  if (maxErr !== undefined) {
    return maxErr;
  }
  const sortOrder = maxRes.data?.[0] === undefined ? 0 : maxRes.data[0].sort_order + 1;
  const {data, error} = await ctx.data.supabase
    .from('bk_asset_type')
    .insert({pod_id: podId, label: label.trim(), slug, sort_order: sortOrder, is_system: false})
    .select('*')
    .single();
  const createErr = dbErr(error);
  if (createErr !== undefined) {
    return createErr;
  }
  return agentOk(data);
}

export async function deleteAgentBookAssetType(request: Request, args: unknown): Promise<AgentResult<unknown>> {
  const record = bookArgs(args);
  const podId = podIdFromArgs(record);
  const assetTypeId = typeof record.assetTypeId === 'string' ? record.assetTypeId : '';
  if (podId === '' || assetTypeId === '') {
    return agentValidation('podId and assetTypeId are required');
  }
  const ctx = await requirePodAgent(request, bookCall(podId, ApiKeyAction.DELETE));
  if (!ctx.ok) {
    return ctx;
  }
  const countRes = await ctx.data.supabase.from('bk_asset').select('id', {count: 'exact', head: true}).eq('asset_type_id', assetTypeId);
  const countErr = dbErr(countRes.error);
  if (countErr !== undefined) {
    return countErr;
  }
  if ((countRes.count ?? 0) > 0) {
    return agentErr(409, 'conflict', 'Remove all assets in this type before deleting it');
  }
  const typeRes = await ctx.data.supabase.from('bk_asset_type').select('is_system').eq('id', assetTypeId).eq('pod_id', podId).maybeSingle();
  const typeErr = dbErr(typeRes.error);
  if (typeErr !== undefined) {
    return typeErr;
  }
  if (typeRes.data?.is_system === true) {
    return agentErr(409, 'conflict', 'System asset types cannot be deleted');
  }
  const {error} = await ctx.data.supabase.from('bk_asset_type').delete().eq('id', assetTypeId).eq('pod_id', podId);
  const delErr = dbErr(error);
  if (delErr !== undefined) {
    return delErr;
  }
  return agentOk({deleted: true});
}

export async function createAgentBookAsset(request: Request, args: unknown): Promise<AgentResult<unknown>> {
  const record = bookArgs(args);
  const podId = podIdFromArgs(record);
  const assetTypeId = typeof record.assetTypeId === 'string' ? record.assetTypeId : '';
  const name = typeof record.name === 'string' ? record.name : 'New asset';
  if (podId === '' || assetTypeId === '') {
    return agentValidation('podId and assetTypeId are required');
  }
  const ctx = await requirePodAgent(request, bookCall(podId, ApiKeyAction.CREATE));
  if (!ctx.ok) {
    return ctx;
  }
  const {data, error} = await ctx.data.supabase
    .from('bk_asset')
    .insert({
      pod_id: podId,
      asset_type_id: assetTypeId,
      name,
      description_md: typeof record.descriptionMd === 'string' ? record.descriptionMd : '',
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
  const mapped = await loadMappedBookAsset(ctx.data.supabase, podId, data.id);
  return agentOk(mapped ?? data);
}

export async function updateAgentBookAsset(request: Request, args: unknown): Promise<AgentResult<unknown>> {
  const record = bookArgs(args);
  const podId = podIdFromArgs(record);
  const assetId = typeof record.assetId === 'string' ? record.assetId : '';
  if (podId === '' || assetId === '') {
    return agentValidation('podId and assetId are required');
  }
  const ctx = await requirePodAgent(request, bookCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) {
    return ctx;
  }
  const {error} = await ctx.data.supabase
    .from('bk_asset')
    .update({
      ...(typeof record.name === 'string' ? {name: record.name} : {}),
      ...(typeof record.descriptionMd === 'string' ? {description_md: record.descriptionMd} : {}),
    })
    .eq('id', assetId)
    .eq('pod_id', podId);
  const updErr = dbErr(error);
  if (updErr !== undefined) {
    return updErr;
  }
  const row = await ctx.data.supabase.from('bk_asset').select('*').eq('id', assetId).eq('pod_id', podId).single();
  const rowErr = dbErr(row.error);
  if (rowErr !== undefined) {
    return rowErr;
  }
  const mapped = await loadMappedBookAsset(ctx.data.supabase, podId, assetId);
  return agentOk(mapped ?? row.data);
}

export async function deleteAgentBookAsset(request: Request, args: unknown): Promise<AgentResult<unknown>> {
  const record = bookArgs(args);
  const podId = podIdFromArgs(record);
  const assetId = typeof record.assetId === 'string' ? record.assetId : '';
  if (podId === '' || assetId === '') {
    return agentValidation('podId and assetId are required');
  }
  const ctx = await requirePodAgent(request, bookCall(podId, ApiKeyAction.DELETE));
  if (!ctx.ok) {
    return ctx;
  }
  const {error} = await ctx.data.supabase.from('bk_asset').delete().eq('id', assetId).eq('pod_id', podId);
  const delErr = dbErr(error);
  if (delErr !== undefined) {
    return delErr;
  }
  return agentOk({deleted: true});
}

export async function getAgentBookOfflineBundle(request: Request, args: unknown): Promise<AgentResult<unknown>> {
  const record = bookArgs(args);
  const podId = podIdFromArgs(record);
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
