import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function createDbSpace(name: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase.rpc('create_space', {p_name: name});
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    throw new Error('create_space returned no id');
  }
  return data;
}
