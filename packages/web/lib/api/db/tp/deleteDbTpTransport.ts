import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';

export async function deleteDbTpTransport(
  supabase: SupabaseClient<Database>,
  transportId: string,
) {
  return supabase
    .from('tp_transport')
    .delete()
    .eq('id', transportId);
}
