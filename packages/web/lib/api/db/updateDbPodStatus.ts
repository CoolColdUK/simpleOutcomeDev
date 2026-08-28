import type {PodStatus} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function updateDbPodStatus(podId: string, status: PodStatus): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.rpc('set_pod_status', {p_pod_id: podId, p_status: status});
  throwIfSupabaseError(error);
}
