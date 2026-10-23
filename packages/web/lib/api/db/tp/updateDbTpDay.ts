import type {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {Database} from '@/lib/supabase/database';

export interface UpdateDbTpDayInput {
  readonly dayTitle?: string;
  readonly dayNotes?: string;
  readonly primaryDestinationId?: string | null;
}

export default async function updateDbTpDay(dayId: string, input: UpdateDbTpDayInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase
    .from('tp_day')
    .update({
      day_title: input.dayTitle ?? null,
      day_notes: input.dayNotes ?? null,
      primary_destination_id: input.primaryDestinationId ?? null,
    })
    .eq('id', dayId);
  throwIfSupabaseError(error);
}

export interface UpdateTpDayInput {
  readonly dayId: string;
  readonly day_title?: string;
  readonly day_notes?: string;
  readonly primary_destination_id?: string;
}

export async function updateDbTpDayForAgent(
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
