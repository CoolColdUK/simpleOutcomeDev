import type {SpaceInviteMode} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function createDbSpaceInvite(
  spaceId: string,
  mode: SpaceInviteMode,
  expiresAtIso: string | undefined,
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase.rpc('create_space_invite', {
    p_space_id: spaceId,
    p_mode: mode,
    p_expires_at: expiresAtIso ?? null,
  });
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    throw new Error('create_space_invite returned no token');
  }
  return data;
}
