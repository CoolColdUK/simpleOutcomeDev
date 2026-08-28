import type {SpaceRole} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface DbSpaceMember {
  readonly userId: string;
  readonly role: SpaceRole;
  readonly username: string | undefined;
}

interface MemberRow {
  readonly user_id: string;
  readonly role: string;
  readonly profile: {readonly username: string | null} | null;
}

export default async function listDbSpaceMembers(spaceId: string): Promise<readonly DbSpaceMember[]> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('space_member')
    .select('user_id, role, profile:profile(username)')
    .eq('space_id', spaceId);
  throwIfSupabaseError(error);
  const rows = (data ?? []) as unknown as readonly MemberRow[];
  return rows.map((row) => ({
    userId: row.user_id,
    role: row.role as SpaceRole,
    username: row.profile?.username ?? undefined,
  }));
}
