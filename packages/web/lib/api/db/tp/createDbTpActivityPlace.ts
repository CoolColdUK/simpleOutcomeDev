import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface CreateDbTpActivityPlaceInput {
  readonly actionId: string;
  readonly placeText: string;
  readonly mapsUrl?: string;
  readonly notes?: string;
  readonly sortOrder?: number;
}

export default async function createDbTpActivityPlace(input: CreateDbTpActivityPlaceInput): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('tp_activity_place')
    .insert({
      action_id: input.actionId,
      place_text: input.placeText,
      maps_url: input.mapsUrl ?? null,
      notes: input.notes ?? null,
      sort_order: input.sortOrder ?? 0,
    })
    .select('id')
    .single();
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    throw new Error('create activity place returned no id');
  }
  return data.id;
}

export interface CreateTpActivityPlaceInputForAgent {
  readonly actionId: string;
  readonly placeText: string;
  readonly mapsUrl?: string;
  readonly notes?: string;
  readonly sortOrder: number;
}

export async function createDbTpActivityPlaceForAgent(
  supabase: SupabaseClient<Database>,
  input: CreateTpActivityPlaceInputForAgent,
) {
  return supabase
    .from('tp_activity_place')
    .insert({
      action_id: input.actionId,
      place_text: input.placeText,
      maps_url: input.mapsUrl ?? null,
      notes: input.notes ?? null,
      sort_order: input.sortOrder,
    })
    .select('*')
    .single();
}
