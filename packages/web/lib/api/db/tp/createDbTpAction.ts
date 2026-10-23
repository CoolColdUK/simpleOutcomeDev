import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {TpActionKind} from '@so/model';

// Client-side UI helper (from PR #14)
export interface CreateDbTpActionInput {
  readonly tripId: string;
  readonly anchorDayId?: string;
  readonly kind: TpActionKind;
  readonly title: string;
  readonly sortOrder?: number;
}

export default async function createDbTpAction(input: CreateDbTpActionInput): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('tp_action')
    .insert({
      trip_id: input.tripId,
      anchor_day_id: input.anchorDayId ?? null,
      kind: input.kind,
      title: input.title,
      sort_order: input.sortOrder ?? 0,
    })
    .select('id')
    .single();
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    throw new Error('create action returned no id');
  }
  return data.id;
}

// Server-side agent helper (for REST/MCP API)
export interface CreateTpActionInputForAgent {
  readonly tripId: string;
  readonly kind: string;
  readonly title: string;
  readonly anchorDayId?: string;
  readonly destinationId?: string;
  readonly placeText?: string;
  readonly mapsUrl?: string;
  readonly fromPlace?: string;
  readonly toPlace?: string;
  readonly fromDestinationId?: string;
  readonly toDestinationId?: string;
  readonly fromMapsUrl?: string;
  readonly toMapsUrl?: string;
  readonly checkInAt?: string;
  readonly checkOutAt?: string;
  readonly checkInTimezone?: string;
  readonly checkOutTimezone?: string;
  readonly startTime?: string;
  readonly endTime?: string;
  readonly costAmount?: number;
  readonly costCurrency?: string;
  readonly bookingRef?: string;
  readonly url?: string;
  readonly notes?: string;
  readonly sortOrder: number;
  readonly done?: boolean;
}

export async function createDbTpActionForAgent(
  supabase: SupabaseClient<Database>,
  input: CreateTpActionInputForAgent,
) {
  return supabase
    .from('tp_action')
    .insert({
      trip_id: input.tripId,
      kind: input.kind,
      title: input.title,
      anchor_day_id: input.anchorDayId ?? null,
      destination_id: input.destinationId ?? null,
      place_text: input.placeText ?? null,
      maps_url: input.mapsUrl ?? null,
      from_place: input.fromPlace ?? null,
      to_place: input.toPlace ?? null,
      from_destination_id: input.fromDestinationId ?? null,
      to_destination_id: input.toDestinationId ?? null,
      from_maps_url: input.fromMapsUrl ?? null,
      to_maps_url: input.toMapsUrl ?? null,
      check_in_at: input.checkInAt ?? null,
      check_out_at: input.checkOutAt ?? null,
      check_in_timezone: input.checkInTimezone ?? null,
      check_out_timezone: input.checkOutTimezone ?? null,
      start_time: input.startTime ?? null,
      end_time: input.endTime ?? null,
      cost_amount: input.costAmount ?? null,
      cost_currency: input.costCurrency ?? null,
      booking_ref: input.bookingRef ?? null,
      url: input.url ?? null,
      notes: input.notes ?? null,
      sort_order: input.sortOrder,
      done: input.done ?? false,
    })
    .select('*')
    .single();
}
