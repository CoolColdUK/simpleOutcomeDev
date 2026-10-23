import type {SupabaseClient} from '@supabase/supabase-js';
import {planTpDaySync} from '@so/model';
import type {Database} from '@/lib/supabase/database';

export default async function syncDbTpDaysForTrip(
  supabase: SupabaseClient<Database>,
  tripId: string,
  startDate: string,
  endDate: string,
): Promise<{error: Error | null}> {
  const existing = await supabase
    .from('tp_day')
    .select('id, day_index, calendar_date')
    .eq('trip_id', tripId)
    .order('day_index');
  if (existing.error !== null) {
    return {error: existing.error};
  }

  const plan = planTpDaySync(
    (existing.data ?? []).map((row) => ({
      id: row.id,
      dayIndex: row.day_index,
      calendarDate: row.calendar_date,
    })),
    startDate,
    endDate,
  );

  if (plan.deleteIds.length > 0) {
    const deleted = await supabase.from('tp_day').delete().in('id', [...plan.deleteIds]);
    if (deleted.error !== null) {
      return {error: deleted.error};
    }
  }

  const updateResults = await Promise.all(
    plan.updates.map((row) =>
      supabase.from('tp_day').update({day_index: row.dayIndex, calendar_date: row.calendarDate}).eq('id', row.id),
    ),
  );
  const updateFailed = updateResults.find((result) => result.error !== null);
  if (updateFailed?.error !== null && updateFailed?.error !== undefined) {
    return {error: updateFailed.error};
  }

  if (plan.inserts.length > 0) {
    const inserted = await supabase.from('tp_day').insert(
      plan.inserts.map((row) => ({
        trip_id: tripId,
        day_index: row.dayIndex,
        calendar_date: row.calendarDate,
      })),
    );
    if (inserted.error !== null) {
      return {error: inserted.error};
    }
  }

  return {error: null};
}
