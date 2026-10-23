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
  const {podId, defaultCurrency, title, timezone, startDate, endDate, status, budgetAmount, budgetCurrency, mapsUrl, notes} =
    input;

  const tripUpdates: Database['public']['Tables']['tp_trip']['Update'] = {
    ...(title !== undefined ? {title} : {}),
    ...(timezone !== undefined ? {timezone} : {}),
    ...(startDate !== undefined ? {start_date: startDate} : {}),
    ...(endDate !== undefined ? {end_date: endDate} : {}),
    ...(status !== undefined ? {status} : {}),
    ...(budgetAmount !== undefined ? {budget_amount: budgetAmount} : {}),
    ...(budgetCurrency !== undefined ? {budget_currency: budgetCurrency} : {}),
    ...(mapsUrl !== undefined ? {maps_url: mapsUrl} : {}),
    ...(notes !== undefined ? {notes} : {}),
  };

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
