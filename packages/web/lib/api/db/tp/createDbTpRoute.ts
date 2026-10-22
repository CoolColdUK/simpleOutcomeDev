import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

// Client-side UI helper (from PR #14)
export default async function createDbTpRoute(actionId: string, name: string, sortOrder: number): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('tp_route')
    .insert({action_id: actionId, name, is_selected: false, sort_order: sortOrder})
    .select('id')
    .single();
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    throw new Error('create route returned no id');
  }
  return data.id;
}

// Server-side agent helper (for REST/MCP API)
export interface CreateTpRouteInputForAgent {
  readonly actionId: string;
  readonly name: string;
  readonly notes?: string;
  readonly sortOrder: number;
}

export async function createDbTpRouteForAgent(
  supabase: SupabaseClient<Database>,
  input: CreateTpRouteInputForAgent,
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
