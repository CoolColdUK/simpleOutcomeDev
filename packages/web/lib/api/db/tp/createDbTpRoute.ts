import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';

export interface CreateTpRouteInput {
  readonly actionId: string;
  readonly name: string;
  readonly notes?: string;
  readonly sortOrder: number;
}

export async function createDbTpRoute(
  supabase: SupabaseClient<Database>,
  input: CreateTpRouteInput,
) {
  return supabase
    .from('tp_route')
    .insert({
      action_id: input.actionId,
      name: input.name,
      notes: input.notes ?? null,
      sort_order: input.sortOrder,
    })
    .select('*')
    .single();
}
