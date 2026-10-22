import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';

export async function updateDbTpDestination(
  supabase: SupabaseClient<Database>,
  destinationId: string,
  updates: Record<string, unknown>,
) {
  return supabase
    .from('tp_destination')
    .update(updates)
    .eq('id', destinationId)
    .select('*')
    .single();
}
