import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

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
}

export default async function updateDbTpTransport(transportId: string, input: UpdateDbTpTransportInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase
    .from('tp_transport')
    .update({
      mode: input.mode,
      from_place: input.fromPlace ?? null,
      to_place: input.toPlace ?? null,
      depart_at: input.departAt ?? null,
      arrive_at: input.arriveAt ?? null,
      depart_timezone: input.departTimezone ?? null,
      arrive_timezone: input.arriveTimezone ?? null,
      cost_amount: input.costAmount,
      cost_currency: input.costCurrency ?? null,
      booking_ref: input.bookingRef ?? null,
      url: input.url ?? null,
      notes: input.notes ?? null,
      sort_order: input.sortOrder,
    })
    .eq('id', transportId);
  throwIfSupabaseError(error);
}
