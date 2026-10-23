import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function deleteDbTpAction(
  supabase: SupabaseClient<Database>,
  actionId: string,
) {
  return supabase
    .from('tp_action')
    .delete()
    .eq('id', actionId);
}

export async function deleteDbTpActionForBrowser(actionId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const result = await deleteDbTpAction(supabase, actionId);
  throwIfSupabaseError(result.error);
}
