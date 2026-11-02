import type {SupabaseClient} from '@supabase/supabase-js';
import {BUCKET_POD_PRIVATE} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';
import {assertTpTripUnlockedForAttachment} from '@/lib/api/db/tp/tpDbLockChecks';

export default async function deleteDbTpAttachment(attachmentId: string, storagePath: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await assertTpTripUnlockedForAttachment(supabase, attachmentId);
  const {error: storageErr} = await supabase.storage.from(BUCKET_POD_PRIVATE).remove([storagePath]);
  throwIfSupabaseError(storageErr);
  const {error} = await supabase.from('tp_attachment').delete().eq('id', attachmentId);
  throwIfSupabaseError(error);
}

export async function deleteDbTpAttachmentForAgent(
  supabase: SupabaseClient<Database>,
  attachmentId: string,
) {
  await assertTpTripUnlockedForAttachment(supabase, attachmentId);
  const att = await supabase
    .from('tp_attachment')
    .select('storage_path')
    .eq('id', attachmentId)
    .single();

  if (att.data?.storage_path) {
    await supabase.storage
      .from(BUCKET_POD_PRIVATE)
      .remove([att.data.storage_path]);
  }

  return supabase
    .from('tp_attachment')
    .delete()
    .eq('id', attachmentId);
}
