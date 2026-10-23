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
}

export default async function updateDbTpAction(actionId: string, input: UpdateDbTpActionInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase
    .from('tp_action')
    .update({
      title: input.title,
      notes: input.notes ?? null,
      place_text: input.placeText ?? null,
      maps_url: input.mapsUrl ?? null,
      from_maps_url: input.fromMapsUrl ?? null,
      to_maps_url: input.toMapsUrl ?? null,
      destination_id: input.destinationId ?? null,
      check_in_at: input.checkInAt ?? null,
      check_out_at: input.checkOutAt ?? null,
      check_in_timezone: input.checkInTimezone ?? null,
      check_out_timezone: input.checkOutTimezone ?? null,
      cost_amount: input.costAmount,
      cost_currency: input.costCurrency ?? null,
      from_place: input.fromPlace ?? null,
      to_place: input.toPlace ?? null,
      from_destination_id: input.fromDestinationId ?? null,
      to_destination_id: input.toDestinationId ?? null,
      selected_route_id: input.selectedRouteId ?? null,
    })
    .eq('id', actionId);
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
