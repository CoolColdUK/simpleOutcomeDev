import {
  BUCKET_POD_PRIVATE,
  buildTodoCardImageObjectPath,
  encodeSoImageMarkdownUri,
  normalizeTodoImageMimeFromBlobType,
} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';

export default async function uploadStorageTodoInlineImageMarkdownFragment(
  podId: string,
  cardId: string,
  blob: Blob,
): Promise<string> {
  const mime = normalizeTodoImageMimeFromBlobType(blob.type);
  if (mime === undefined) {
    throw new Error('Only JPEG or PNG images are supported.');
  }
  const supabase = getSupabaseBrowserClient();
  const objectPath = buildTodoCardImageObjectPath(podId, cardId, mime);
  const {error} = await supabase.storage.from(BUCKET_POD_PRIVATE).upload(objectPath, blob, {
    contentType: mime,
    upsert: false,
  });
  if (error !== null) {
    throw new Error(error.message);
  }
  return `![](${encodeSoImageMarkdownUri(objectPath)})`;
}
