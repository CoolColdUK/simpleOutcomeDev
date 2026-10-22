import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import uploadStorageTpAttachment from '@/lib/api/storage/uploadStorageTpAttachment';

export default async function createDbTpAttachment(
  podId: string,
  tripId: string,
  uploadedBy: string,
  parent: {transportId: string} | {destinationId: string},
  file: File,
): Promise<void> {
  const attachmentId = crypto.randomUUID();
  const storagePath = await uploadStorageTpAttachment(podId, parent, attachmentId, file);
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.from('tp_attachment').insert({
    id: attachmentId,
    pod_id: podId,
    trip_id: tripId,
    transport_id: 'transportId' in parent ? parent.transportId : null,
    destination_id: 'destinationId' in parent ? parent.destinationId : null,
    storage_path: storagePath,
    file_name: file.name,
    mime_type: file.type,
    byte_size: file.size,
    uploaded_by: uploadedBy,
  });
  throwIfSupabaseError(error);
}
