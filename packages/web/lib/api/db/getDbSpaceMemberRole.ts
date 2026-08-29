import type {SpaceRole} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function getDbSpaceMemberRole(spaceId: string, userId: string): Promise<SpaceRole | undefined> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('space_member')
    .select('role')
    .eq('space_id', spaceId)
    .eq('user_id', userId)
    .maybeSingle();
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    return undefined;
  }
  return data.role as SpaceRole;
}
