import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';

export interface UploadTpAttachmentInput {
  readonly podId: string;
  readonly tripId: string;
  readonly transportId?: string;
  readonly destinationId?: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly contentBase64: string;
  readonly uploadedBy: string;
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'application/pdf'];

export default async function uploadDbTpAttachment(
  supabase: SupabaseClient<Database>,
  input: UploadTpAttachmentInput,
) {
  // Validate MIME type
  if (!ALLOWED_MIMES.includes(input.mimeType)) {
    return {
      data: null,
      error: new Error(`Invalid MIME type. Allowed: ${ALLOWED_MIMES.join(', ')}`),
    };
  }
  
  // Validate exactly one parent
  if ((input.transportId && input.destinationId) || (!input.transportId && !input.destinationId)) {
    return {
      data: null,
      error: new Error('Exactly one parent (transportId or destinationId) is required'),
    };
  }
  
  // Decode base64 and check size
  let buffer: Buffer;
  try {
    buffer = Buffer.from(input.contentBase64, 'base64');
  } catch {
    return {
      data: null,
      error: new Error('Invalid base64 content'),
    };
  }
  
  if (buffer.length > MAX_SIZE_BYTES) {
    return {
      data: null,
      error: new Error(`File too large. Maximum size: 5MB. Got: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`),
    };
  }
  
  // Generate attachment ID
  const attachmentId = crypto.randomUUID();
  
  // Sanitize filename
  const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Build storage path
  const parentType = input.transportId ? 'transport' : 'destination';
  const parentId = input.transportId ?? input.destinationId;
  const storagePath = `${input.podId}/tp/${parentType}/${parentId}/${attachmentId}-${safeFileName}`;
  
  // Upload to storage
  const upload = await supabase.storage
    .from('pod-private')
    .upload(storagePath, buffer, {
      contentType: input.mimeType,
      upsert: false,
    });
  
  if (upload.error) {
    return {data: null, error: upload.error};
  }
  
  // Create DB record
  return supabase
    .from('tp_attachment')
    .insert({
      id: attachmentId,
      pod_id: input.podId,
      trip_id: input.tripId,
      transport_id: input.transportId ?? null,
      destination_id: input.destinationId ?? null,
      storage_path: storagePath,
      file_name: input.fileName,
      mime_type: input.mimeType,
      byte_size: buffer.length,
      uploaded_by: input.uploadedBy,
    })
    .select('*')
    .single();
}
