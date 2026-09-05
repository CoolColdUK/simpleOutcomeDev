import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function undoDbFpImport(importId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.rpc('undo_fp_import', {p_import_id: importId});
  throwIfSupabaseError(error);
}
