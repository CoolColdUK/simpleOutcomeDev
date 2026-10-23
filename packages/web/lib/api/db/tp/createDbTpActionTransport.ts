import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

export interface CreateDbTpActionTransportInput {
  readonly actionId: string;
  readonly transportLibId: string;
  readonly sortOrder?: number;
}

export async function createDbTpActionTransportForAgent(
  supabase: SupabaseClient<Database>,
  input: CreateDbTpActionTransportInput,
) {
  return supabase
    .from('tp_action_transport')
    .insert({
      action_id: input.actionId,
      transport_lib_id: input.transportLibId,
      sort_order: input.sortOrder ?? 0,
    })
    .select('*')
    .single();
}

export default async function createDbTpActionTransport(input: CreateDbTpActionTransportInput): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await createDbTpActionTransportForAgent(supabase, input);
  throwIfSupabaseError(error);
  if (data === null) {
    throw new Error('create action transport returned no id');
  }
  return data.id;
}
