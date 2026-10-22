import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';

export interface UpdateTpTripInput {
  readonly podId: string;
  readonly title?: string;
  readonly timezone?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly status?: string;
  readonly budgetAmount?: number;
  readonly budgetCurrency?: string;
  readonly mapsUrl?: string;
  readonly notes?: string;
  readonly defaultCurrency?: string; // Updates tp_setting
}

export default async function updateDbTpTrip(supabase: SupabaseClient<Database>, input: UpdateTpTripInput) {
  const {podId, defaultCurrency, ...tripUpdates} = input;
  
  // Update trip
  const trip = await supabase
    .from('tp_trip')
    .update(tripUpdates)
    .eq('pod_id', podId)
    .select('*')
    .single();
  
  // Update settings if defaultCurrency provided
  if (defaultCurrency !== undefined) {
    await supabase
      .from('tp_setting')
      .update({default_currency: defaultCurrency})
      .eq('pod_id', podId);
  }
  
  return trip;
}
