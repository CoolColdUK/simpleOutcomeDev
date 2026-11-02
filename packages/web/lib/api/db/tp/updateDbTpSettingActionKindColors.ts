import type {TpActionKindColors} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import {assertTpTripUnlockedByPodId} from '@/lib/api/db/tp/tpDbLockChecks';

export default async function updateDbTpSettingActionKindColors(
  podId: string,
  actionKindColors: TpActionKindColors | null,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await assertTpTripUnlockedByPodId(supabase, podId);
  const {error} = await supabase
    .from('tp_setting')
    .update({action_kind_colors: actionKindColors})
    .eq('pod_id', podId);
  throwIfSupabaseError(error);
}
