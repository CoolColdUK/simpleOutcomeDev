import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

export interface UpdateDbTpActionLocationInput {
  readonly sortOrder?: number;
  readonly done?: boolean;
}

export async function updateDbTpActionLocationForAgent(
  supabase: SupabaseClient<Database>,
  linkId: string,
  input: UpdateDbTpActionLocationInput,
) {
  const patch: Database['public']['Tables']['tp_action_location']['Update'] = {};
  if (input.sortOrder !== undefined) {
    patch.sort_order = input.sortOrder;
  }
  if (input.done !== undefined) {
    patch.done = input.done;
  }
  return supabase.from('tp_action_location').update(patch).eq('id', linkId).select('*').single();
}

export default async function updateDbTpActionLocation(
  linkId: string,
  input: UpdateDbTpActionLocationInput,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await updateDbTpActionLocationForAgent(supabase, linkId, input);
  throwIfSupabaseError(error);
}
