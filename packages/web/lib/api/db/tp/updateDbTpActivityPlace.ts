import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface UpdateDbTpActivityPlaceInput {
  readonly placeText?: string;
  readonly mapsUrl?: string | null;
  readonly notes?: string | null;
  readonly sortOrder?: number;
}

export default async function updateDbTpActivityPlace(placeId: string, input: UpdateDbTpActivityPlaceInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const patch: Database['public']['Tables']['tp_activity_place']['Update'] = {};
  if (input.placeText !== undefined) {
    patch.place_text = input.placeText;
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
  if (Object.keys(patch).length === 0) {
    return;
  }
  const {error} = await supabase.from('tp_activity_place').update(patch).eq('id', placeId);
  throwIfSupabaseError(error);
}

export interface UpdateTpActivityPlaceInputForAgent {
  readonly placeId: string;
  readonly placeText?: string;
  readonly mapsUrl?: string | null;
  readonly notes?: string | null;
  readonly sortOrder?: number;
}

export async function updateDbTpActivityPlaceForAgent(
  supabase: SupabaseClient<Database>,
  input: UpdateTpActivityPlaceInputForAgent,
) {
  const patch: Database['public']['Tables']['tp_activity_place']['Update'] = {};
  if (input.placeText !== undefined) {
    patch.place_text = input.placeText;
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
  return supabase.from('tp_activity_place').update(patch).eq('id', input.placeId).select('*').single();
}
