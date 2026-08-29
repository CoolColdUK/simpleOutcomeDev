import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function updateDbSpace(spaceId: string, name: string, description?: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.rpc('update_space', {
    p_space_id: spaceId,
    p_name: name,
    p_description: description ?? '',
  });
  throwIfSupabaseError(error);
}
