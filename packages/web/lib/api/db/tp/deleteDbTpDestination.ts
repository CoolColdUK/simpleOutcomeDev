import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';

export default async function deleteDbTpDestination(
  supabase: SupabaseClient<Database>,
  destinationId: string,
) {
  return supabase
    .from('tp_destination')
    .delete()
    .eq('id', destinationId);
}
