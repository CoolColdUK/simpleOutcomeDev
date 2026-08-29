import {PodRole} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function addDbPodMemberByUsername(
  podId: string,
  username: string,
  role: Exclude<PodRole, PodRole.OWNER>,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.rpc('add_pod_member_by_username', {
    p_pod_id: podId,
    p_username: username,
    p_role: role,
  });
  throwIfSupabaseError(error);
}
