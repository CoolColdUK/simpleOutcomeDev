import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function createDbSpaceInvite(
  spaceId: string,
  expiresInDays: number,
  maxUses: number,
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase.rpc('create_space_invite', {
    p_space_id: spaceId,
    p_expires_in_days: expiresInDays,
    p_max_uses: maxUses,
  });
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    throw new Error('create_space_invite returned no token');
  }
  return data;
}
