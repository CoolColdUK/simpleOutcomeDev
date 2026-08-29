import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function updateSupabaseAuthPassword(password: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.auth.updateUser({password});
  throwIfSupabaseError(error);
}
