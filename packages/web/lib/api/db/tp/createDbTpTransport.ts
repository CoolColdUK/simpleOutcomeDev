import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';

export interface CreateTpTransportInput {
  readonly routeId: string;
  readonly mode: string;
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

export async function createDbTpTransport(
  supabase: SupabaseClient<Database>,
  input: CreateTpTransportInput,
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
