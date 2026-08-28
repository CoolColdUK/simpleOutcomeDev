import type {SpaceRole} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function updateDbSpaceMemberRole(
  spaceId: string,
  userId: string,
  role: Exclude<SpaceRole, 'space_owner'>,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.rpc('update_space_member_role', {
    p_space_id: spaceId,
    p_user_id: userId,
    p_role: role,
  });
  throwIfSupabaseError(error);
}
