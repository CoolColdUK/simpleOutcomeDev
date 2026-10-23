import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';
import syncDbTpDaysForTrip from '@/lib/api/db/tp/syncDbTpDaysForTrip';

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

  const existing = await supabase.from('tp_trip').select('id, start_date, end_date').eq('pod_id', podId).maybeSingle();
  if (existing.error !== null) {
    return {data: null, error: existing.error};
  }
  if (existing.data === null) {
    return {data: null, error: null};
  }

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

  const trip = await supabase.from('tp_trip').update(tripUpdates).eq('pod_id', podId).select('*').maybeSingle();

  if (trip.error !== null) {
    return trip;
  }
  if (trip.data === null) {
    return {data: null, error: null};
  }

  const nextStart = trip.data.start_date;
  const nextEnd = trip.data.end_date;
  const datesChanged = startDate !== undefined || endDate !== undefined;
  if (datesChanged) {
    const synced = await syncDbTpDaysForTrip(supabase, existing.data.id, nextStart, nextEnd);
    if (synced.error !== null) {
      return {data: null, error: synced.error};
    }
  }

  if (defaultCurrency !== undefined) {
    const settings = await supabase.from('tp_setting').update({default_currency: defaultCurrency}).eq('pod_id', podId);
    if (settings.error !== null) {
      return {data: trip.data, error: settings.error};
    }
  }

  return trip;
}
