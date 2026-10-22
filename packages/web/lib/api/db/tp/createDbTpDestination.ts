import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';

export interface CreateTpDestinationInput {
  readonly tripId: string;
  readonly name: string;
  readonly sortOrder?: number;
  readonly mapsUrl?: string;
  readonly timezoneHint?: string;
  readonly importantInfo?: string;
  readonly activeStartDate?: string;
  readonly activeEndDate?: string;
  readonly notes?: string;
}

export default async function createDbTpDestination(
  supabase: SupabaseClient<Database>,
  input: CreateTpDestinationInput,
) {
  return supabase
    .from('tp_destination')
    .insert({
      trip_id: input.tripId,
      name: input.name,
      sort_order: input.sortOrder ?? 0,
      maps_url: input.mapsUrl ?? null,
      timezone_hint: input.timezoneHint ?? null,
      important_info: input.importantInfo ?? null,
      active_start_date: input.activeStartDate ?? null,
      active_end_date: input.activeEndDate ?? null,
      notes: input.notes ?? null,
    })
    .select('*')
    .single();
}
