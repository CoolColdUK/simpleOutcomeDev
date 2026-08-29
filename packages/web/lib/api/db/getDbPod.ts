import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import {mapDbPod, type DbPod} from '@/lib/api/db/listDbPods';

export default async function getDbPod(podId: string): Promise<DbPod | undefined> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('pod')
    .select('id, space_id, feature, name, description, visibility, status, created_by')
    .eq('id', podId)
    .maybeSingle();
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    return undefined;
  }
  return mapDbPod(data);
}
