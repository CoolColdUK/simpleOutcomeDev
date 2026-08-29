import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function updateDbProfileDisplayName(displayName: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.rpc('update_profile_display_name', {p_display_name: displayName});
  throwIfSupabaseError(error);
}
