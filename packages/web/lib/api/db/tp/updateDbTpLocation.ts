import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

export interface UpdateDbTpLocationInput {
  readonly name?: string;
  readonly address?: string | null;
  readonly mapsUrl?: string | null;
  readonly notes?: string | null;
  readonly sortOrder?: number;
}

export async function updateDbTpLocationForAgent(
  supabase: SupabaseClient<Database>,
  locationId: string,
  input: UpdateDbTpLocationInput,
) {
  const patch: Database['public']['Tables']['tp_location']['Update'] = {};
  if (input.name !== undefined) {
    patch.name = input.name;
  }
  if (input.address !== undefined) {
    patch.address = input.address;
  }
  if (input.mapsUrl !== undefined) {
    patch.maps_url = input.mapsUrl;
  }
  if (input.notes !== undefined) {
    patch.notes = input.notes;
  }
  if (input.sortOrder !== undefined) {
    patch.sort_order = input.sortOrder;
  }
  return supabase.from('tp_location').update(patch).eq('id', locationId).select('*').single();
}

export default async function updateDbTpLocation(locationId: string, input: UpdateDbTpLocationInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await updateDbTpLocationForAgent(supabase, locationId, input);
  throwIfSupabaseError(error);
}
