import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import throwIfTpDbMutationError from '@/lib/api/db/tp/throwIfTpDbMutationError';
import updateDbTpTrip, {type UpdateTpTripInput} from '@/lib/api/db/tp/updateDbTpTrip';

export default async function updateDbTpTripForBrowser(input: UpdateTpTripInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const result = await updateDbTpTrip(supabase, input);
  throwIfTpDbMutationError(result.error);
}

export async function updateDbTpTripLockedForBrowser(tripId: string, locked: boolean): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.from('tp_trip').update({locked}).eq('id', tripId);
  throwIfSupabaseError(error);
}

export async function updateDbTpActionLockedForBrowser(actionId: string, locked: boolean): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {data, error: loadErr} = await supabase
    .from('tp_action')
    .select('kind, trip_id')
    .eq('id', actionId)
    .maybeSingle();
  throwIfSupabaseError(loadErr);
  if (data === null || data.kind !== 'activity') {
    throw new Error('Only activity actions can be locked');
  }
  const {assertTpTripUnlocked} = await import('@/lib/api/db/tp/tpDbLockChecks');
  await assertTpTripUnlocked(supabase, data.trip_id);
  const {error} = await supabase.from('tp_action').update({locked}).eq('id', actionId);
  throwIfSupabaseError(error);
}
