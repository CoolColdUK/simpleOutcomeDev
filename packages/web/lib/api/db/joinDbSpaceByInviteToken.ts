import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function joinDbSpaceByInviteToken(token: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase.rpc('join_space_with_invite', {p_token: token});
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    throw new Error('join_space_with_invite returned no space');
  }
  return data;
}
