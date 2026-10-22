import {BUCKET_POD_PRIVATE} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'application/pdf']);

export default async function uploadStorageTpAttachment(
  podId: string,
  parent: {transportId: string} | {destinationId: string},
  attachmentId: string,
  file: File,
): Promise<string> {
  if (!ALLOWED.has(file.type)) {
    throw new Error('Only JPEG, PNG, and PDF files are allowed');
  }
  if (file.size > 5_242_880) {
    throw new Error('File exceeds 5MB limit');
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const folder =
    'transportId' in parent
      ? `tp/transport/${parent.transportId}`
      : `tp/destination/${parent.destinationId}`;
  const objectPath = `${podId}/${folder}/${attachmentId}-${safeName}`;
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.storage.from(BUCKET_POD_PRIVATE).upload(objectPath, file, {contentType: file.type, upsert: false});
  throwIfSupabaseError(error);
  return objectPath;
}
