import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

export default async function deleteDbTpTransport(transportId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.from('tp_transport').delete().eq('id', transportId);
  throwIfSupabaseError(error);
}

export async function deleteDbTpTransportForAgent(
  supabase: SupabaseClient<Database>,
  transportId: string,
) {
  return supabase
    .from('tp_transport')
    .delete()
    .eq('id', transportId);
}
