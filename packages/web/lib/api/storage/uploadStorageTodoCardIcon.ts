import {
  BUCKET_POD_PRIVATE,
  buildTodoCardIconObjectPath,
  normalizeTodoImageMimeFromBlobType,
  TODO_MAX_ICON_BYTES,
} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';

export default async function uploadStorageTodoCardIcon(
  podId: string,
  cardId: string,
  blob: Blob,
): Promise<string> {
  const mime = normalizeTodoImageMimeFromBlobType(blob.type);
  if (mime === undefined) {
    throw new Error('Only JPEG or PNG images are supported.');
  }
  if (blob.size > TODO_MAX_ICON_BYTES) {
    throw new Error('Icon must be 5MB or smaller.');
  }
  const supabase = getSupabaseBrowserClient();
  const objectPath = buildTodoCardIconObjectPath(podId, cardId, mime);
  const {error} = await supabase.storage.from(BUCKET_POD_PRIVATE).upload(objectPath, blob, {
    contentType: mime,
    upsert: false,
  });
  if (error !== null) {
    throw new Error(error.message);
  }
  return objectPath;
}
