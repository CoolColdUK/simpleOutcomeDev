import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

export async function deleteDbTpActionLocationForAgent(supabase: SupabaseClient<Database>, linkId: string) {
  return supabase.from('tp_action_location').delete().eq('id', linkId);
}

export default async function deleteDbTpActionLocation(linkId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await deleteDbTpActionLocationForAgent(supabase, linkId);
  throwIfSupabaseError(error);
}
