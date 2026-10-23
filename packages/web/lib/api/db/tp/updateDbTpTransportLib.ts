import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

export interface UpdateDbTpTransportLibInput {
  readonly label?: string;
  readonly mode?: string;
  readonly durationMinutes?: number | null;
  readonly costAmount?: number | null;
  readonly costCurrency?: string | null;
  readonly fromLocationId?: string | null;
  readonly toLocationId?: string | null;
  readonly notes?: string | null;
  readonly sortOrder?: number;
}

export async function updateDbTpTransportLibForAgent(
  supabase: SupabaseClient<Database>,
  transportLibId: string,
  input: UpdateDbTpTransportLibInput,
) {
  const patch: Database['public']['Tables']['tp_transport_lib']['Update'] = {};
  if (input.label !== undefined) {
    patch.label = input.label;
  }
  if (input.mode !== undefined) {
    patch.mode = input.mode;
  }
  if (input.durationMinutes !== undefined) {
    patch.duration_minutes = input.durationMinutes;
  }
  if (input.costAmount !== undefined) {
    patch.cost_amount = input.costAmount;
  }
  if (input.costCurrency !== undefined) {
    patch.cost_currency = input.costCurrency;
  }
  if (input.fromLocationId !== undefined) {
    patch.from_location_id = input.fromLocationId;
  }
  if (input.toLocationId !== undefined) {
    patch.to_location_id = input.toLocationId;
  }
  if (input.notes !== undefined) {
    patch.notes = input.notes;
  }
  if (input.sortOrder !== undefined) {
    patch.sort_order = input.sortOrder;
  }
  return supabase.from('tp_transport_lib').update(patch).eq('id', transportLibId).select('*').single();
}

export default async function updateDbTpTransportLib(transportLibId: string, input: UpdateDbTpTransportLibInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await updateDbTpTransportLibForAgent(supabase, transportLibId, input);
  throwIfSupabaseError(error);
}
