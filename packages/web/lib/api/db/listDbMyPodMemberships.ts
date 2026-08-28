import type {PodRole} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface DbPodMembership {
  readonly podId: string;
  readonly role: PodRole;
}

export default async function listDbMyPodMemberships(userId: string): Promise<readonly DbPodMembership[]> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase.from('pod_member').select('pod_id, role').eq('user_id', userId);
  throwIfSupabaseError(error);
  return (data ?? []).map((row) => ({
    podId: row.pod_id,
    role: row.role as PodRole,
  }));
}
