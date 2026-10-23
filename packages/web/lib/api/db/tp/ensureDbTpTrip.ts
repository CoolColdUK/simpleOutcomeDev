import type {SupabaseClient} from '@supabase/supabase-js';
import {defaultTpTripCalendarDateUtc, defaultTpTripTitle, TpTripStatus} from '@so/model';
import type {Database} from '@/lib/supabase/database';
import syncDbTpDaysForTrip from '@/lib/api/db/tp/syncDbTpDaysForTrip';

export interface EnsureDbTpTripResult {
  readonly tripId: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly error: Error | null;
}

export default async function ensureDbTpTrip(
  supabase: SupabaseClient<Database>,
  podId: string,
): Promise<EnsureDbTpTripResult> {
  const existing = await supabase.from('tp_trip').select('id, start_date, end_date').eq('pod_id', podId).maybeSingle();
  if (existing.error !== null) {
    return {tripId: '', startDate: '', endDate: '', error: existing.error};
  }
  if (existing.data !== null) {
    const synced = await syncDbTpDaysForTrip(supabase, existing.data.id, existing.data.start_date, existing.data.end_date);
    if (synced.error !== null) {
      return {tripId: '', startDate: '', endDate: '', error: synced.error};
    }
    return {
      tripId: existing.data.id,
      startDate: existing.data.start_date,
      endDate: existing.data.end_date,
      error: null,
    };
  }

  const pod = await supabase.from('pod').select('name').eq('id', podId).maybeSingle();
  if (pod.error !== null) {
    return {tripId: '', startDate: '', endDate: '', error: pod.error};
  }

  const calendarDate = defaultTpTripCalendarDateUtc();
  const title = defaultTpTripTitle(pod.data?.name);
  const inserted = await supabase
    .from('tp_trip')
    .insert({
      pod_id: podId,
      title,
      timezone: 'UTC',
      start_date: calendarDate,
      end_date: calendarDate,
      status: TpTripStatus.DRAFT,
    })
    .select('id, start_date, end_date')
    .maybeSingle();

  if (inserted.error !== null) {
    const raced = await supabase.from('tp_trip').select('id, start_date, end_date').eq('pod_id', podId).maybeSingle();
    if (raced.error !== null || raced.data === null) {
      return {tripId: '', startDate: '', endDate: '', error: inserted.error};
    }
    return {
      tripId: raced.data.id,
      startDate: raced.data.start_date,
      endDate: raced.data.end_date,
      error: null,
    };
  }
  if (inserted.data === null) {
    return {tripId: '', startDate: '', endDate: '', error: new Error('ensure trip returned no row')};
  }

  const synced = await syncDbTpDaysForTrip(
    supabase,
    inserted.data.id,
    inserted.data.start_date,
    inserted.data.end_date,
  );
  if (synced.error !== null) {
    return {tripId: '', startDate: '', endDate: '', error: synced.error};
  }

  return {
    tripId: inserted.data.id,
    startDate: inserted.data.start_date,
    endDate: inserted.data.end_date,
    error: null,
  };
}
