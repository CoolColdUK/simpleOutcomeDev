import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

export interface UpdateDbTpActionTransportInput {
  readonly sortOrder?: number;
  readonly durationMinutes?: number | null;
  readonly costAmount?: number | null;
  readonly costCurrency?: string | null;
  readonly fromLocationId?: string | null;
  readonly toLocationId?: string | null;
  readonly done?: boolean;
}

export async function updateDbTpActionTransportForAgent(
  supabase: SupabaseClient<Database>,
  linkId: string,
  input: UpdateDbTpActionTransportInput,
) {
  const patch: Database['public']['Tables']['tp_action_transport']['Update'] = {};
  if (input.sortOrder !== undefined) {
    patch.sort_order = input.sortOrder;
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
  if (input.done !== undefined) {
    patch.done = input.done;
  }
  return supabase.from('tp_action_transport').update(patch).eq('id', linkId).select('*').single();
}

export default async function updateDbTpActionTransport(
  linkId: string,
  input: UpdateDbTpActionTransportInput,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await updateDbTpActionTransportForAgent(supabase, linkId, input);
  throwIfSupabaseError(error);
}
