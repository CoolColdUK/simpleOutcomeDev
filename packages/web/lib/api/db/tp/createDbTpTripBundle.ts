import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import {syncTpCalendarDates, TpTripStatus} from '@so/model';
import type {Database} from '@/lib/supabase/database';

export interface CreateDbTpTripBundleInput {
  readonly podId: string;
  readonly title: string;
  readonly timezone: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly destinationNames: readonly string[];
  readonly budgetAmount?: number;
  readonly budgetCurrency?: string;
}

export async function createDbTpTripBundleWithClient(
  supabase: SupabaseClient<Database>,
  input: CreateDbTpTripBundleInput,
): Promise<string> {
  const {data: trip, error: tripErr} = await supabase
    .from('tp_trip')
    .insert({
      pod_id: input.podId,
      title: input.title,
      timezone: input.timezone,
      start_date: input.startDate,
      end_date: input.endDate,
      status: TpTripStatus.DRAFT,
      budget_amount: input.budgetAmount,
      budget_currency: input.budgetCurrency,
    })
    .select('id')
    .single();
  throwIfSupabaseError(tripErr);
  if (trip === undefined || trip === null) {
    throw new Error('create trip returned no id');
  }
  const tripId = trip.id;
  const dates = syncTpCalendarDates(input.startDate, input.endDate);
  if (dates.length > 0) {
    const {error: dayErr} = await supabase.from('tp_day').insert(
      dates.map((calendarDate, dayIndex) => ({
        trip_id: tripId,
        day_index: dayIndex,
        calendar_date: calendarDate,
      })),
    );
    throwIfSupabaseError(dayErr);
  }
  const names = input.destinationNames.map((n) => n.trim()).filter((n) => n !== '');
  if (names.length > 0) {
    const {error: destErr} = await supabase.from('tp_destination').insert(
      names.map((name, sortOrder) => ({
        trip_id: tripId,
        name,
        sort_order: sortOrder,
        active_start_date: input.startDate,
        active_end_date: input.endDate,
      })),
    );
    throwIfSupabaseError(destErr);
  }
  return tripId;
}

export default async function createDbTpTripBundle(input: CreateDbTpTripBundleInput): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  return createDbTpTripBundleWithClient(supabase, input);
}
