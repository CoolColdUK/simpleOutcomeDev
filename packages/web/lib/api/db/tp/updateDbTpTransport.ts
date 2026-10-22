import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';

export interface UpdateTpTransportInput {
  readonly transportId: string;
  readonly [key: string]: unknown;
}

export async function updateDbTpTransport(
  supabase: SupabaseClient<Database>,
  input: UpdateTpTransportInput,
) {
  const {transportId, ...updates} = input;
  
  return supabase
    .from('tp_transport')
    .update(updates)
    .eq('id', transportId)
    .select('*')
    .single();
}
