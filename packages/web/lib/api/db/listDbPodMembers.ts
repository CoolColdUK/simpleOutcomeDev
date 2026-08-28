import type {PodRole} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface DbPodMember {
  readonly userId: string;
  readonly role: PodRole;
  readonly username: string | undefined;
}

interface MemberRow {
  readonly user_id: string;
  readonly role: string;
  readonly profile: {readonly username: string | null} | null;
}

export default async function listDbPodMembers(podId: string): Promise<readonly DbPodMember[]> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('pod_member')
    .select('user_id, role, profile:profile(username)')
    .eq('pod_id', podId);
  throwIfSupabaseError(error);
  const rows = (data ?? []) as unknown as readonly MemberRow[];
  return rows.map((row) => ({
    userId: row.user_id,
    role: row.role as PodRole,
    username: row.profile?.username ?? undefined,
  }));
}
