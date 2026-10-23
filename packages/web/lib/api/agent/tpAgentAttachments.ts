/**
 * Trip planning agent: attachment operations
 */

import {ApiKeyAction} from '@so/model';
import {agentErr, agentOk, dbErr, type AgentResult} from '@/lib/api/agent/agentResult';
import {requirePodAgent} from '@/lib/api/agent/loadAgentContext';
import {tpCall, ownedTpRow} from '@/lib/api/agent/tpAgentCall';
import listDbTpAttachments from '@/lib/api/db/tp/listDbTpAttachments';
import uploadDbTpAttachment from '@/lib/api/db/tp/uploadDbTpAttachment';
import {deleteDbTpAttachmentForAgent} from '@/lib/api/db/tp/deleteDbTpAttachment';

export async function listAgentTpAttachments(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  
  if (!podId) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId is required'};
  }
  
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.READ));
  if (!ctx.ok) return ctx;
  
  const result = await listDbTpAttachments(ctx.data.supabase, {
    podId,
    transportId: typeof args.transportId === 'string' ? args.transportId : undefined,
    destinationId: typeof args.destinationId === 'string' ? args.destinationId : undefined,
  });
  
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  
  // Generate signed URLs for each attachment
  const attachments = result.data ?? [];
  const withUrls = await Promise.all(
    attachments.map(async (att) => {
      const signed = await ctx.data.supabase.storage
        .from('pod-private')
        .createSignedUrl(att.storage_path, 3600);
      
      return {
        ...att,
        signedUrl: signed.data?.signedUrl ?? null,
      };
    }),
  );
  
  return agentOk({attachments: withUrls});
}

export async function uploadAgentTpAttachment(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const fileName = typeof args.fileName === 'string' ? args.fileName : '';
  const mimeType = typeof args.mimeType === 'string' ? args.mimeType : '';
  const contentBase64 = typeof args.contentBase64 === 'string' ? args.contentBase64 : '';
  
  if (!podId || !fileName || !mimeType || !contentBase64) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId, fileName, mimeType, and contentBase64 are required'};
  }
  
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.CREATE));
  if (!ctx.ok) return ctx;
  
  // Get trip ID
  const trip = await ctx.data.supabase.from('tp_trip').select('id').eq('pod_id', podId).single();
  const tripErr = dbErr(trip.error);
  if (tripErr !== undefined) return tripErr;
  if (trip.data === null) return agentErr(404, 'not_found', 'Trip not found');
  
  // Verify parent ownership
  if (typeof args.transportId === 'string') {
    const owned = await ownedTpRow(ctx.data, 'tp_transport', args.transportId, podId);
    if (!owned.ok) return owned;
  }
  
  if (typeof args.destinationId === 'string') {
    const owned = await ownedTpRow(ctx.data, 'tp_destination', args.destinationId, podId);
    if (!owned.ok) return owned;
  }
  
  const result = await uploadDbTpAttachment(ctx.data.supabase, {
    podId,
    tripId: trip.data.id,
    transportId: typeof args.transportId === 'string' ? args.transportId : undefined,
    destinationId: typeof args.destinationId === 'string' ? args.destinationId : undefined,
    fileName,
    mimeType,
    contentBase64,
    uploadedBy: ctx.data.pod.created_by ?? 'unknown',
  });
  
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  if (result.data === null) return agentErr(500, 'internal_error', 'Failed to upload attachment');
  
  // Generate signed URL
  const signed = await ctx.data.supabase.storage
    .from('pod-private')
    .createSignedUrl(result.data.storage_path, 3600);
  
  return agentOk({
    ...result.data,
    signedUrl: signed.data?.signedUrl ?? null,
  });
}

export async function deleteAgentTpAttachment(request: Request, input: unknown): Promise<AgentResult<unknown>> {
  const args = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const podId = typeof args.podId === 'string' ? args.podId : '';
  const attachmentId = typeof args.attachmentId === 'string' ? args.attachmentId : '';
  
  if (!podId || !attachmentId) {
    return {ok: false, status: 400, code: 'validation_error', message: 'podId and attachmentId are required'};
  }
  
  const ctx = await requirePodAgent(request, tpCall(podId, ApiKeyAction.DELETE));
  if (!ctx.ok) return ctx;
  
  // Verify ownership
  const owned = await ownedTpRow(ctx.data, 'tp_attachment', attachmentId, podId);
  if (!owned.ok) return owned;
  
  const result = await deleteDbTpAttachmentForAgent(ctx.data.supabase, attachmentId);
  const resultErr = dbErr(result.error);
  if (resultErr !== undefined) return resultErr;
  
  return agentOk({ok: true});
}
