import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export async function deleteDbTpActivityPlaceForAgent(
  supabase: SupabaseClient<Database>,
  placeId: string,
) {
  return supabase.from('tp_activity_place').delete().eq('id', placeId);
}

export default async function deleteDbTpActivityPlace(placeId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const result = await deleteDbTpActivityPlaceForAgent(supabase, placeId);
  throwIfSupabaseError(result.error);
}
