import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import {mapDbFpSetting, type DbFpSetting} from '@/lib/api/db/mapDbFpSetting';

export default async function getDbFpSetting(podId: string): Promise<DbFpSetting | undefined> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase.from('fp_setting').select('pod_id, currency, permission').eq('pod_id', podId).maybeSingle();
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    return undefined;
  }
  return mapDbFpSetting(data);
}
