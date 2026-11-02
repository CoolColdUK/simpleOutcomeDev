import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';
import {assertTpTripUnlockedForTransportLib} from '@/lib/api/db/tp/tpDbLockChecks';

export async function deleteDbTpTransportLibForAgent(supabase: SupabaseClient<Database>, transportLibId: string) {
  await assertTpTripUnlockedForTransportLib(supabase, transportLibId);
  return supabase.from('tp_transport_lib').delete().eq('id', transportLibId);
}

export default async function deleteDbTpTransportLib(transportLibId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await deleteDbTpTransportLibForAgent(supabase, transportLibId);
  throwIfSupabaseError(error);
}
