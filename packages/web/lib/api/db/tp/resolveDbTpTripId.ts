import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';
import ensureDbTpTrip from '@/lib/api/db/tp/ensureDbTpTrip';

export default async function resolveDbTpTripId(
  supabase: SupabaseClient<Database>,
  podId: string,
): Promise<{tripId: string | null; error: Error | null}> {
  const ensured = await ensureDbTpTrip(supabase, podId);
  if (ensured.error !== null) {
    return {tripId: null, error: ensured.error};
  }
  return {tripId: ensured.tripId, error: null};
}
