import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

export interface UpdateDbTpRouteInput {
  readonly name?: string;
  readonly notes?: string | null;
  readonly sortOrder?: number;
  readonly costAmount?: number | null;
  readonly costCurrency?: string | null;
  readonly durationMinutes?: number | null;
  readonly transportLibId?: string | null;
}

export async function updateDbTpRouteForAgent(
  supabase: SupabaseClient<Database>,
  routeId: string,
  input: UpdateDbTpRouteInput,
) {
  const patch: Database['public']['Tables']['tp_route']['Update'] = {};
  if (input.name !== undefined) {
    patch.name = input.name;
  }
  if (input.notes !== undefined) {
    patch.notes = input.notes;
  }
  if (input.sortOrder !== undefined) {
    patch.sort_order = input.sortOrder;
  }
  if (input.costAmount !== undefined) {
    patch.cost_amount = input.costAmount;
  }
  if (input.costCurrency !== undefined) {
    patch.cost_currency = input.costCurrency;
  }
  if (input.durationMinutes !== undefined) {
    patch.duration_minutes = input.durationMinutes;
  }
  if (input.transportLibId !== undefined) {
    patch.transport_lib_id = input.transportLibId;
  }
  return supabase.from('tp_route').update(patch).eq('id', routeId).select('*').single();
}

export default async function updateDbTpRoute(routeId: string, input: UpdateDbTpRouteInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await updateDbTpRouteForAgent(supabase, routeId, input);
  throwIfSupabaseError(error);
}
