import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

export interface UpdateDbTpTransportInput {
  readonly mode?: string;
  readonly fromPlace?: string | null;
  readonly toPlace?: string | null;
  readonly departAt?: string | null;
  readonly arriveAt?: string | null;
  readonly departTimezone?: string | null;
  readonly arriveTimezone?: string | null;
  readonly costAmount?: number | null;
  readonly costCurrency?: string | null;
  readonly bookingRef?: string | null;
  readonly url?: string | null;
  readonly notes?: string | null;
  readonly sortOrder?: number;
  readonly durationMinutes?: number | null;
  readonly fromLocationId?: string | null;
  readonly toLocationId?: string | null;
  readonly done?: boolean;
}

function buildTpTransportPatch(input: UpdateDbTpTransportInput): Database['public']['Tables']['tp_transport']['Update'] {
  const patch: Database['public']['Tables']['tp_transport']['Update'] = {};
  if (input.mode !== undefined) {
    patch.mode = input.mode;
  }
  if (input.fromPlace !== undefined) {
    patch.from_place = input.fromPlace;
  }
  if (input.toPlace !== undefined) {
    patch.to_place = input.toPlace;
  }
  if (input.departAt !== undefined) {
    patch.depart_at = input.departAt;
  }
  if (input.arriveAt !== undefined) {
    patch.arrive_at = input.arriveAt;
  }
  if (input.departTimezone !== undefined) {
    patch.depart_timezone = input.departTimezone;
  }
  if (input.arriveTimezone !== undefined) {
    patch.arrive_timezone = input.arriveTimezone;
  }
  if (input.costAmount !== undefined) {
    patch.cost_amount = input.costAmount;
  }
  if (input.costCurrency !== undefined) {
    patch.cost_currency = input.costCurrency;
  }
  if (input.bookingRef !== undefined) {
    patch.booking_ref = input.bookingRef;
  }
  if (input.url !== undefined) {
    patch.url = input.url;
  }
  if (input.notes !== undefined) {
    patch.notes = input.notes;
  }
  if (input.sortOrder !== undefined) {
    patch.sort_order = input.sortOrder;
  }
  if (input.durationMinutes !== undefined) {
    patch.duration_minutes = input.durationMinutes;
  }
  if (input.fromLocationId !== undefined) {
    patch.from_location_id = input.fromLocationId;
  }
  if (input.toLocationId !== undefined) {
    patch.to_location_id = input.toLocationId;
  }
  if (input.done !== undefined) {
    patch.done = input.done;
  }
  return patch;
}

export default async function updateDbTpTransport(transportId: string, input: UpdateDbTpTransportInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const patch = buildTpTransportPatch(input);
  if (Object.keys(patch).length === 0) {
    return;
  }
  const {error} = await supabase.from('tp_transport').update(patch).eq('id', transportId);
  throwIfSupabaseError(error);
}

export interface UpdateTpTransportInput {
  readonly transportId: string;
  readonly [key: string]: unknown;
}

export async function updateDbTpTransportForAgent(
  supabase: SupabaseClient<Database>,
  input: UpdateTpTransportInput,
) {
  const {transportId, ...updates} = input;

  return supabase
    .from('tp_transport')
    .update(updates as Database['public']['Tables']['tp_transport']['Update'])
    .eq('id', transportId)
    .select('*')
    .single();
}
