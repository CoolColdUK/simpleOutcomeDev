import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function revokeDbApiKey(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.rpc('revoke_api_key', {p_id: id});
  throwIfSupabaseError(error);
}
