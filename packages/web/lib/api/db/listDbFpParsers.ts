import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import {mapDbFpParser, type DbFpParser} from '@/lib/api/db/mapDbFpParser';

export default async function listDbFpParsers(podId: string): Promise<readonly DbFpParser[]> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('fp_parser')
    .select('id, pod_id, name, identifier, has_header, skip_rows, delimiter, column_map')
    .eq('pod_id', podId)
    .order('name', {ascending: true});
  throwIfSupabaseError(error);
  return (data ?? []).map(mapDbFpParser);
}
