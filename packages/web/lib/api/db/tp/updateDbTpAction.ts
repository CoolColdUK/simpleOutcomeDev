import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

export interface UpdateDbTpActionInput {
  readonly title?: string;
  readonly notes?: string;
  readonly placeText?: string;
  readonly mapsUrl?: string | null;
  readonly fromMapsUrl?: string | null;
  readonly toMapsUrl?: string | null;
  readonly destinationId?: string | null;
  readonly checkInAt?: string | null;
  readonly checkOutAt?: string | null;
  readonly checkInTimezone?: string | null;
  readonly checkOutTimezone?: string | null;
  readonly costAmount?: number | null;
  readonly costCurrency?: string | null;
  readonly fromPlace?: string | null;
  readonly toPlace?: string | null;
  readonly fromDestinationId?: string | null;
  readonly toDestinationId?: string | null;
  readonly selectedRouteId?: string | null;
  readonly startTime?: string | null;
  readonly endTime?: string | null;
  readonly fromLocationId?: string | null;
  readonly toLocationId?: string | null;
  readonly durationMinutes?: number | null;
}

function buildTpActionPatch(input: UpdateDbTpActionInput): Database['public']['Tables']['tp_action']['Update'] {
  const patch: Database['public']['Tables']['tp_action']['Update'] = {};
  if (input.title !== undefined) {
    patch.title = input.title;
  }
  if (input.notes !== undefined) {
    patch.notes = input.notes ?? null;
  }
  if (input.placeText !== undefined) {
    patch.place_text = input.placeText ?? null;
  }
  if (input.mapsUrl !== undefined) {
    patch.maps_url = input.mapsUrl;
  }
  if (input.fromMapsUrl !== undefined) {
    patch.from_maps_url = input.fromMapsUrl;
  }
  if (input.toMapsUrl !== undefined) {
    patch.to_maps_url = input.toMapsUrl;
  }
  if (input.destinationId !== undefined) {
    patch.destination_id = input.destinationId;
  }
  if (input.checkInAt !== undefined) {
    patch.check_in_at = input.checkInAt;
  }
  if (input.checkOutAt !== undefined) {
    patch.check_out_at = input.checkOutAt;
  }
  if (input.checkInTimezone !== undefined) {
    patch.check_in_timezone = input.checkInTimezone;
  }
  if (input.checkOutTimezone !== undefined) {
    patch.check_out_timezone = input.checkOutTimezone;
  }
  if (input.costAmount !== undefined) {
    patch.cost_amount = input.costAmount;
  }
  if (input.costCurrency !== undefined) {
    patch.cost_currency = input.costCurrency;
  }
  if (input.fromPlace !== undefined) {
    patch.from_place = input.fromPlace;
  }
  if (input.toPlace !== undefined) {
    patch.to_place = input.toPlace;
  }
  if (input.fromDestinationId !== undefined) {
    patch.from_destination_id = input.fromDestinationId;
  }
  if (input.toDestinationId !== undefined) {
    patch.to_destination_id = input.toDestinationId;
  }
  if (input.selectedRouteId !== undefined) {
    patch.selected_route_id = input.selectedRouteId;
  }
  if (input.startTime !== undefined) {
    patch.start_time = input.startTime;
  }
  if (input.endTime !== undefined) {
    patch.end_time = input.endTime;
  }
  if (input.fromLocationId !== undefined) {
    patch.from_location_id = input.fromLocationId;
  }
  if (input.toLocationId !== undefined) {
    patch.to_location_id = input.toLocationId;
  }
  if (input.durationMinutes !== undefined) {
    patch.duration_minutes = input.durationMinutes;
  }
  return patch;
}

export default async function updateDbTpAction(actionId: string, input: UpdateDbTpActionInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const patch = buildTpActionPatch(input);
  if (Object.keys(patch).length === 0) {
    return;
  }
  const {error} = await supabase.from('tp_action').update(patch).eq('id', actionId);
  throwIfSupabaseError(error);
}

export interface UpdateTpActionInput {
  readonly actionId: string;
  readonly [key: string]: unknown;
}

export async function updateDbTpActionForAgent(
  supabase: SupabaseClient<Database>,
  input: UpdateTpActionInput,
) {
  const {actionId, ...updates} = input;

  return supabase
    .from('tp_action')
    .update(updates as Database['public']['Tables']['tp_action']['Update'])
    .eq('id', actionId)
    .select('*')
    .single();
}
