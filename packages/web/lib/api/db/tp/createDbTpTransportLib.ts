import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

export interface CreateDbTpTransportLibInput {
  readonly tripId: string;
  readonly label: string;
  readonly mode?: string | null;
  readonly durationMinutes?: number;
  readonly costAmount?: number;
  readonly costCurrency?: string;
  readonly fromLocationId?: string;
  readonly toLocationId?: string;
  readonly notes?: string;
  readonly sortOrder?: number;
}

export async function createDbTpTransportLibForAgent(
  supabase: SupabaseClient<Database>,
  input: CreateDbTpTransportLibInput,
) {
  return supabase
    .from('tp_transport_lib')
    .insert({
      trip_id: input.tripId,
      label: input.label,
      mode: input.mode ?? null,
      duration_minutes: input.durationMinutes ?? null,
      cost_amount: input.costAmount ?? null,
      cost_currency: input.costCurrency ?? null,
      from_location_id: input.fromLocationId ?? null,
      to_location_id: input.toLocationId ?? null,
      notes: input.notes ?? null,
      sort_order: input.sortOrder ?? 0,
    })
    .select('*')
    .single();
}

export default async function createDbTpTransportLib(input: CreateDbTpTransportLibInput): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await createDbTpTransportLibForAgent(supabase, input);
  throwIfSupabaseError(error);
  if (data === null) {
    throw new Error('create transport lib returned no id');
  }
  return data.id;
}
