import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import {mapDbFpImport, type DbFpImport} from '@/lib/api/db/mapDbFpImport';

export default async function listDbFpImports(podId: string): Promise<readonly DbFpImport[]> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('fp_import')
    .select('id, pod_id, parser_id, account_id, created_at, undone_at')
    .eq('pod_id', podId)
    .order('created_at', {ascending: false});
  throwIfSupabaseError(error);
  return (data ?? []).map(mapDbFpImport);
}
