import {
  ApiKeyAction,
  BUCKET_POD_PRIVATE,
  BOOK_MAX_ASSET_IMAGE_BYTES,
  assertBookAssetImageObjectPath,
  normalizeAgentBookAssetImageMime,
  parseBookAssetImageBase64Payload,
} from '@so/model';
import {agentErr, agentOk, agentValidation, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent, type AgentContext} from '@/lib/api/agent/loadAgentContext';
import {bookCall} from '@/lib/api/agent/bookAgentCall';
import mapBookAssetForAgent, {type AgentBookAssetPayload} from '@/lib/api/agent/mapBookAssetForAgent';
import {loadDbBookWorkspaceWithClient} from '@/lib/api/db/book/loadDbBookWorkspace';
import insertDbBkAssetImage from '@/lib/api/db/book/insertDbBkAssetImage';
import uploadStorageBookAssetImageBytes from '@/lib/api/storage/uploadStorageBookAssetImageBytes';

type AgentBookAssetWithSignedUrls = AgentBookAssetPayload & {
  readonly images: readonly (AgentBookAssetPayload['images'][number] & {readonly signedUrl?: string})[];
};

function bookArgs(args: unknown): Record<string, unknown> {
  return typeof args === 'object' && args !== null && !Array.isArray(args) ? (args as Record<string, unknown>) : {};
}

function podIdFromArgs(args: Record<string, unknown>): string {
  return typeof args.podId === 'string' ? args.podId : '';
}

async function ensureAssetBelongsToPod(
  ctx: AgentContext,
  podId: string,
  assetId: string,
): Promise<AgentResult<{readonly assetId: string}>> {
  const row = await ctx.supabase.from('bk_asset').select('id').eq('id', assetId).eq('pod_id', podId).maybeSingle();
  const rowErr = dbErr(row.error);
  if (rowErr !== undefined) {
    return rowErr;
  }
  if (row.data === null) {
    return agentErr(404, 'not_found', 'Asset not found');
  }
  return agentOk({assetId});
}

async function mapAssetWithSignedUrls(ctx: AgentContext, podId: string, assetId: string): Promise<AgentBookAssetWithSignedUrls | undefined> {
  const workspace = await loadDbBookWorkspaceWithClient(ctx.supabase, podId);
  const asset = workspace?.assets.find((row) => row.id === assetId);
  if (asset === undefined) {
    return undefined;
  }
  const mapped = mapBookAssetForAgent(asset);
  const paths = [...new Set(mapped.images.map((image) => image.storagePath))];
  const signed = paths.length === 0 ? {data: [] as {path: string | null; signedUrl: string | null}[]} : await ctx.supabase.storage.from(BUCKET_POD_PRIVATE).createSignedUrls(paths, 60 * 60);
  const urlByPath = new Map(
    (signed.data ?? [])
      .filter((row) => row.path !== null && row.signedUrl !== null && row.signedUrl !== '')
      .map((row) => [row.path as string, row.signedUrl as string]),
  );
  return {
    ...mapped,
    images: mapped.images.map((image) => ({
      ...image,
      signedUrl: urlByPath.get(image.storagePath),
    })),
  };
}

export async function uploadAgentBookAssetImage(request: Request, args: unknown): Promise<AgentResult<AgentBookAssetWithSignedUrls>> {
  const record = bookArgs(args);
  const podId = podIdFromArgs(record);
  const assetId = typeof record.assetId === 'string' ? record.assetId : '';
  const imageBase64 = typeof record.imageBase64 === 'string' ? record.imageBase64 : '';
  const mimeType = typeof record.mimeType === 'string' ? record.mimeType : '';
  const caption = typeof record.caption === 'string' ? record.caption : undefined;
  if (podId === '' || assetId === '' || imageBase64 === '' || mimeType === '') {
    return agentValidation('podId, assetId, imageBase64, and mimeType are required');
  }
  const mime = normalizeAgentBookAssetImageMime(mimeType);
  if (mime === undefined) {
    return agentValidation('mimeType must be image/jpeg or image/png');
  }
  const parsed = parseBookAssetImageBase64Payload(imageBase64);
  if (parsed.mimeFromDataUrl !== undefined && parsed.mimeFromDataUrl !== mime) {
    return agentValidation('mimeType does not match data URL image type');
  }
  let bytes: Buffer;
  try {
    bytes = Buffer.from(parsed.base64, 'base64');
  } catch {
    return agentValidation('imageBase64 is not valid base64');
  }
  if (bytes.length === 0 || bytes.length > BOOK_MAX_ASSET_IMAGE_BYTES) {
    return agentValidation(`Image must be between 1 byte and ${BOOK_MAX_ASSET_IMAGE_BYTES} bytes`);
  }
  const ctx = await requirePodAgent(request, bookCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) {
    return ctx;
  }
  const assetCheck = await ensureAssetBelongsToPod(ctx.data, podId, assetId);
  if (!assetCheck.ok) {
    return assetCheck;
  }
  let storagePath: string;
  try {
    storagePath = await uploadStorageBookAssetImageBytes(ctx.data.supabase, podId, assetId, bytes, mime);
  } catch (unknown: unknown) {
    return agentErr(500, 'error', unknown instanceof Error ? unknown.message : String(unknown));
  }
  const inserted = await insertDbBkAssetImage(ctx.data.supabase, podId, assetId, storagePath, caption);
  if (inserted === undefined) {
    return agentErr(500, 'internal', 'Failed to record asset image');
  }
  const mapped = await mapAssetWithSignedUrls(ctx.data, podId, assetId);
  if (mapped === undefined) {
    return agentErr(500, 'internal', 'Failed to load asset');
  }
  return agentOk(mapped);
}

export async function removeAgentBookAssetImage(request: Request, args: unknown): Promise<AgentResult<AgentBookAssetWithSignedUrls>> {
  const record = bookArgs(args);
  const podId = podIdFromArgs(record);
  const assetId = typeof record.assetId === 'string' ? record.assetId : '';
  const storagePath = typeof record.storagePath === 'string' ? record.storagePath : undefined;
  const imageIndex = typeof record.imageIndex === 'number' ? record.imageIndex : undefined;
  if (podId === '' || assetId === '') {
    return agentValidation('podId and assetId are required');
  }
  if (storagePath === undefined && imageIndex === undefined) {
    return agentValidation('Provide storagePath or imageIndex');
  }
  const ctx = await requirePodAgent(request, bookCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) {
    return ctx;
  }
  const assetCheck = await ensureAssetBelongsToPod(ctx.data, podId, assetId);
  if (!assetCheck.ok) {
    return assetCheck;
  }
  const imagesRes = await ctx.data.supabase
    .from('bk_asset_image')
    .select('*')
    .eq('pod_id', podId)
    .eq('asset_id', assetId)
    .order('sort_order');
  const imagesErr = dbErr(imagesRes.error);
  if (imagesErr !== undefined) {
    return imagesErr;
  }
  const rows = imagesRes.data ?? [];
  const target =
    storagePath !== undefined
      ? rows.find((row) => row.storage_path === storagePath)
      : imageIndex !== undefined
        ? rows[imageIndex]
        : undefined;
  if (target === undefined) {
    return agentErr(404, 'not_found', 'Asset image not found');
  }
  if (!assertBookAssetImageObjectPath(podId, assetId, target.storage_path)) {
    return agentValidation('storagePath is not valid for this asset');
  }
  const {error: delErr} = await ctx.data.supabase.from('bk_asset_image').delete().eq('id', target.id).eq('pod_id', podId);
  const deleteRowErr = dbErr(delErr);
  if (deleteRowErr !== undefined) {
    return deleteRowErr;
  }
  await ctx.data.supabase.storage.from(BUCKET_POD_PRIVATE).remove([target.storage_path]);
  const mapped = await mapAssetWithSignedUrls(ctx.data, podId, assetId);
  if (mapped === undefined) {
    return agentErr(500, 'internal', 'Failed to load asset');
  }
  return agentOk(mapped);
}

export async function reorderAgentBookAssetImages(request: Request, args: unknown): Promise<AgentResult<AgentBookAssetWithSignedUrls>> {
  const record = bookArgs(args);
  const podId = podIdFromArgs(record);
  const assetId = typeof record.assetId === 'string' ? record.assetId : '';
  const orderedStoragePaths = Array.isArray(record.orderedStoragePaths)
    ? record.orderedStoragePaths.filter((value): value is string => typeof value === 'string')
    : [];
  if (podId === '' || assetId === '' || orderedStoragePaths.length === 0) {
    return agentValidation('podId, assetId, and orderedStoragePaths are required');
  }
  const ctx = await requirePodAgent(request, bookCall(podId, ApiKeyAction.UPDATE));
  if (!ctx.ok) {
    return ctx;
  }
  const assetCheck = await ensureAssetBelongsToPod(ctx.data, podId, assetId);
  if (!assetCheck.ok) {
    return assetCheck;
  }
  const imagesRes = await ctx.data.supabase.from('bk_asset_image').select('id, storage_path').eq('pod_id', podId).eq('asset_id', assetId);
  const imagesErr = dbErr(imagesRes.error);
  if (imagesErr !== undefined) {
    return imagesErr;
  }
  const rows = imagesRes.data ?? [];
  const idByPath = new Map(rows.map((row) => [row.storage_path, row.id]));
  const uniquePaths = [...new Set(orderedStoragePaths)];
  if (uniquePaths.length !== rows.length || uniquePaths.some((path) => !idByPath.has(path))) {
    return agentValidation('orderedStoragePaths must list each current image storage path exactly once');
  }
  await Promise.all(
    uniquePaths.map((path, index) =>
      ctx.data.supabase
        .from('bk_asset_image')
        .update({sort_order: index})
        .eq('id', idByPath.get(path) as string)
        .eq('asset_id', assetId)
        .eq('pod_id', podId),
    ),
  );
  const mapped = await mapAssetWithSignedUrls(ctx.data, podId, assetId);
  if (mapped === undefined) {
    return agentErr(500, 'internal', 'Failed to load asset');
  }
  return agentOk(mapped);
}
