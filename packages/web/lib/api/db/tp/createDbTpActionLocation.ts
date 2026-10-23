import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

export interface CreateDbTpActionLocationInput {
  readonly actionId: string;
  readonly locationId: string;
  readonly sortOrder?: number;
  readonly done?: boolean;
}

export async function createDbTpActionLocationForAgent(
  supabase: SupabaseClient<Database>,
  input: CreateDbTpActionLocationInput,
) {
  return supabase
    .from('tp_action_location')
    .insert({
      action_id: input.actionId,
      location_id: input.locationId,
      sort_order: input.sortOrder ?? 0,
      done: input.done ?? false,
    })
    .select('*')
    .single();
}

export default async function createDbTpActionLocation(input: CreateDbTpActionLocationInput): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await createDbTpActionLocationForAgent(supabase, input);
  throwIfSupabaseError(error);
  if (data === null) {
    throw new Error('create action location returned no id');
  }
  return data.id;
}
