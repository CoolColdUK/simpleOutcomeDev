import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

export async function deleteDbTpLocationForAgent(supabase: SupabaseClient<Database>, locationId: string) {
  return supabase.from('tp_location').delete().eq('id', locationId);
}

export default async function deleteDbTpLocation(locationId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await deleteDbTpLocationForAgent(supabase, locationId);
  throwIfSupabaseError(error);
}
