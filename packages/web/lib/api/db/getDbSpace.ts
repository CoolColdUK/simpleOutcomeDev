import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface DbSpace {
  readonly id: string;
  readonly name: string;
}

export default async function getDbSpace(spaceId: string): Promise<DbSpace | undefined> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase.from('space').select('id, name').eq('id', spaceId).maybeSingle();
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    return undefined;
  }
  return {id: data.id, name: data.name};
}
