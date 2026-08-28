import type {PodVisibility} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function updateDbPod(podId: string, name: string, visibility: PodVisibility): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.rpc('update_pod', {
    p_pod_id: podId,
    p_name: name,
    p_visibility: visibility,
  });
  throwIfSupabaseError(error);
}
