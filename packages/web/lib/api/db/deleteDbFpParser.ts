import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function deleteDbFpParser(parserId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {error} = await supabase.from('fp_parser').delete().eq('id', parserId);
  throwIfSupabaseError(error);
}
