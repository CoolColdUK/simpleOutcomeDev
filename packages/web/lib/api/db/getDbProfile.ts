import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface DbProfile {
  readonly id: string;
  readonly username: string | undefined;
}

export default async function getDbProfile(userId: string): Promise<DbProfile | undefined> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase.from('profile').select('id, username').eq('id', userId).maybeSingle();
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    return undefined;
  }
  return {id: data.id, username: data.username ?? undefined};
}
