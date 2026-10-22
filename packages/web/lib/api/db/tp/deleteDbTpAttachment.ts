import {BUCKET_POD_PRIVATE} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function deleteDbTpAttachment(attachmentId: string, storagePath: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error: storageErr} = await supabase.storage.from(BUCKET_POD_PRIVATE).remove([storagePath]);
  throwIfSupabaseError(storageErr);
  const {error} = await supabase.from('tp_attachment').delete().eq('id', attachmentId);
  throwIfSupabaseError(error);
}
