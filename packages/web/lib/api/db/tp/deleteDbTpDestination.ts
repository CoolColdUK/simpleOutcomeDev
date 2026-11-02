import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';
import {assertTpTripUnlockedForDestination} from '@/lib/api/db/tp/tpDbLockChecks';

export default async function deleteDbTpDestination(
  supabase: SupabaseClient<Database>,
  destinationId: string,
) {
  await assertTpTripUnlockedForDestination(supabase, destinationId);
  return supabase
    .from('tp_destination')
    .delete()
    .eq('id', destinationId);
}
