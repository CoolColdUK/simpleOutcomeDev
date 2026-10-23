import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

// Client-side UI helper (from PR #14)
export interface CreateDbTpTransportFromLib {
  readonly id: string;
  readonly mode?: string;
  readonly durationMinutes?: number;
  readonly costAmount?: number;
  readonly costCurrency?: string;
  readonly fromLocationId?: string;
  readonly toLocationId?: string;
}

export default async function createDbTpTransport(
  routeId: string,
  sortOrder: number,
  lib?: CreateDbTpTransportFromLib,
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('tp_transport')
    .insert({
      route_id: routeId,
      mode: lib?.mode ?? 'other',
      sort_order: sortOrder,
      transport_lib_id: lib?.id ?? null,
      duration_minutes: lib?.durationMinutes ?? null,
      cost_amount: lib?.costAmount ?? null,
      cost_currency: lib?.costCurrency ?? null,
      from_location_id: lib?.fromLocationId ?? null,
      to_location_id: lib?.toLocationId ?? null,
    })
    .select('id')
    .single();
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    throw new Error('create transport returned no id');
  }
  return data.id;
}

// Server-side agent helper (for REST/MCP API)
export interface CreateTpTransportInputForAgent {
  readonly routeId: string;
  readonly mode?: string;
  readonly fromPlace?: string;
  readonly toPlace?: string;
  readonly departAt?: string;
  readonly arriveAt?: string;
  readonly departTimezone?: string;
  readonly arriveTimezone?: string;
  readonly costAmount?: number;
  readonly costCurrency?: string;
  readonly bookingRef?: string;
  readonly url?: string;
  readonly notes?: string;
  readonly sortOrder: number;
}

export async function createDbTpTransportForAgent(
  supabase: SupabaseClient<Database>,
  input: CreateTpTransportInputForAgent,
) {
  return supabase
    .from('tp_transport')
    .insert({
      route_id: input.routeId,
      mode: input.mode,
      from_place: input.fromPlace ?? null,
      to_place: input.toPlace ?? null,
      depart_at: input.departAt ?? null,
      arrive_at: input.arriveAt ?? null,
      depart_timezone: input.departTimezone ?? null,
      arrive_timezone: input.arriveTimezone ?? null,
      cost_amount: input.costAmount ?? null,
      cost_currency: input.costCurrency ?? null,
      booking_ref: input.bookingRef ?? null,
      url: input.url ?? null,
      notes: input.notes ?? null,
      sort_order: input.sortOrder,
    })
    .select('*')
    .single();
}
