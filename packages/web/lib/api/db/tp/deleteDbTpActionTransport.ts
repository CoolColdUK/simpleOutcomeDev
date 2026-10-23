import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

export async function deleteDbTpActionTransportForAgent(supabase: SupabaseClient<Database>, linkId: string) {
  return supabase.from('tp_action_transport').delete().eq('id', linkId);
}

export default async function deleteDbTpActionTransport(linkId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await deleteDbTpActionTransportForAgent(supabase, linkId);
  throwIfSupabaseError(error);
}
