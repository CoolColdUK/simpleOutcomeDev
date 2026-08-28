import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function disableDbSpaceInvite(inviteId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.rpc('disable_space_invite', {p_invite_id: inviteId});
  throwIfSupabaseError(error);
}
