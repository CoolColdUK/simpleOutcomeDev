import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';

export default async function deleteDbTpAction(
  supabase: SupabaseClient<Database>,
  actionId: string,
) {
  return supabase
    .from('tp_action')
    .delete()
    .eq('id', actionId);
}
