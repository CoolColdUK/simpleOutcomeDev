import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

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
