import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {TpActionKind} from '@so/model';

export interface CreateDbTpActionInput {
  readonly tripId: string;
  readonly anchorDayId?: string;
  readonly kind: TpActionKind;
  readonly title: string;
  readonly sortOrder?: number;
}

export default async function createDbTpAction(input: CreateDbTpActionInput): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('tp_action')
    .insert({
      trip_id: input.tripId,
      anchor_day_id: input.anchorDayId ?? null,
      kind: input.kind,
      title: input.title,
      sort_order: input.sortOrder ?? 0,
    })
    .select('id')
    .single();
  throwIfSupabaseError(error);
  return data.id;
}
