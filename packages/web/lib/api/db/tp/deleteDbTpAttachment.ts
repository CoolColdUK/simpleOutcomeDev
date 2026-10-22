import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';

export async function deleteDbTpAttachment(
  supabase: SupabaseClient<Database>,
  attachmentId: string,
) {
  // Get storage path first
  const att = await supabase
    .from('tp_attachment')
    .select('storage_path')
    .eq('id', attachmentId)
    .single();
  
  if (att.data?.storage_path) {
    // Delete from storage
    await supabase.storage
      .from('pod-private')
      .remove([att.data.storage_path]);
  }
  
  // Delete from DB
  return supabase
    .from('tp_attachment')
    .delete()
    .eq('id', attachmentId);
}
