import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

export interface CreateDbTpLocationInput {
  readonly tripId: string;
  readonly name: string;
  readonly address?: string;
  readonly mapsUrl?: string;
  readonly notes?: string;
  readonly openTime?: string;
  readonly closeTime?: string;
  readonly website?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly country?: string;
  readonly locationType?: string;
  readonly sortOrder?: number;
}

export async function createDbTpLocationForAgent(
  supabase: SupabaseClient<Database>,
  input: CreateDbTpLocationInput,
) {
  return supabase
    .from('tp_location')
    .insert({
      trip_id: input.tripId,
      name: input.name,
      address: input.address ?? null,
      maps_url: input.mapsUrl ?? null,
      notes: input.notes ?? null,
      open_time: input.openTime ?? null,
      close_time: input.closeTime ?? null,
      website: input.website ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      country: input.country ?? null,
      location_type: input.locationType ?? 'other',
      sort_order: input.sortOrder ?? 0,
    })
    .select('*')
    .single();
}

export default async function createDbTpLocation(input: CreateDbTpLocationInput): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await createDbTpLocationForAgent(supabase, input);
  throwIfSupabaseError(error);
  if (data === null) {
    throw new Error('create location returned no id');
  }
  return data.id;
}
