import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface DbPodJoinRequest {
  readonly id: string;
  readonly podId: string;
  readonly userId: string;
  readonly status: string;
  readonly username: string | undefined;
}

interface RequestRow {
  readonly id: string;
  readonly pod_id: string;
  readonly user_id: string;
  readonly status: string;
  readonly profile: {readonly username: string | null} | null;
}

export default async function listDbPodJoinRequests(podId: string): Promise<readonly DbPodJoinRequest[]> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('pod_join_request')
    .select('id, pod_id, user_id, status, profile:profile(username)')
    .eq('pod_id', podId)
    .eq('status', 'pending');
  throwIfSupabaseError(error);
  const rows = (data ?? []) as unknown as readonly RequestRow[];
  return rows.map((row) => ({
    id: row.id,
    podId: row.pod_id,
    userId: row.user_id,
    status: row.status,
    username: row.profile?.username ?? undefined,
  }));
}
