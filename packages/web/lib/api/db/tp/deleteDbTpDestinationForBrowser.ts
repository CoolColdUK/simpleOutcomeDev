import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import deleteDbTpDestination from '@/lib/api/db/tp/deleteDbTpDestination';
import {assertTpTripUnlockedForDestination} from '@/lib/api/db/tp/tpDbLockChecks';

export default async function deleteDbTpDestinationForBrowser(destinationId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await assertTpTripUnlockedForDestination(supabase, destinationId);
  const result = await deleteDbTpDestination(supabase, destinationId);
  throwIfSupabaseError(result.error);
}
