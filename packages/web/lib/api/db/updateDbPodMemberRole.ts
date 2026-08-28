import type {PodRole} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function updateDbPodMemberRole(
  podId: string,
  userId: string,
  role: Exclude<PodRole, 'pod_owner'>,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.rpc('update_pod_member_role', {
    p_pod_id: podId,
    p_user_id: userId,
    p_role: role,
  });
  throwIfSupabaseError(error);
}
