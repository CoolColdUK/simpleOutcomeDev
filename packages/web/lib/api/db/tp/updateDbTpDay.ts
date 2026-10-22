import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/lib/supabase/database';

export interface UpdateTpDayInput {
  readonly dayId: string;
  readonly day_title?: string;
  readonly day_notes?: string;
  readonly primary_destination_id?: string;
}

export async function updateDbTpDay(
  supabase: SupabaseClient<Database>,
  input: UpdateTpDayInput,
) {
  const {dayId, ...updates} = input;
  
  return supabase
    .from('tp_day')
    .update(updates)
    .eq('id', dayId)
    .select('*')
    .single();
}
