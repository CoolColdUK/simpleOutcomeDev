import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';

export interface UpdateTpActionInput {
  readonly actionId: string;
  readonly [key: string]: unknown;
}

export async function updateDbTpAction(
  supabase: SupabaseClient<Database>,
  input: UpdateTpActionInput,
) {
  const {actionId, ...updates} = input;
  
  return supabase
    .from('tp_action')
    .update(updates)
    .eq('id', actionId)
    .select('*')
    .single();
}
