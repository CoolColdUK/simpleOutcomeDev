import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import {mapDbFpImportFile, type DbFpImportFile} from '@/lib/api/db/mapDbFpImportFile';

export default async function listDbFpImportFiles(podId: string): Promise<readonly DbFpImportFile[]> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('fp_import_file')
    .select('id, import_id, file_name, content_sha256, parsed, created_count, duplicate_skipped, failed')
    .eq('pod_id', podId)
    .order('created_at', {ascending: false});
  throwIfSupabaseError(error);
  return (data ?? []).map(mapDbFpImportFile);
}
