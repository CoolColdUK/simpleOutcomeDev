import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface UpdateDbTpDestinationInput {
  readonly name?: string;
  readonly importantInfo?: string;
  readonly activeStartDate?: string | null;
  readonly activeEndDate?: string | null;
}

export default async function updateDbTpDestination(destinationId: string, input: UpdateDbTpDestinationInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase
    .from('tp_destination')
    .update({
      name: input.name,
      important_info: input.importantInfo ?? null,
      active_start_date: input.activeStartDate ?? null,
      active_end_date: input.activeEndDate ?? null,
    })
    .eq('id', destinationId);
  throwIfSupabaseError(error);
}
