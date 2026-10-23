import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

export interface CreateDbTpActionTransportInput {
  readonly actionId: string;
  readonly transportLibId: string;
  readonly sortOrder?: number;
  readonly durationMinutes?: number;
  readonly costAmount?: number;
  readonly costCurrency?: string;
  readonly fromLocationId?: string;
  readonly toLocationId?: string;
  readonly done?: boolean;
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
      duration_minutes: input.durationMinutes ?? null,
      cost_amount: input.costAmount ?? null,
      cost_currency: input.costCurrency ?? null,
      from_location_id: input.fromLocationId ?? null,
      to_location_id: input.toLocationId ?? null,
      done: input.done ?? false,
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
