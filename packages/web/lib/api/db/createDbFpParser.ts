import {parseFpName, type FpColumnMap} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export default async function createDbFpParser(
  podId: string,
  name: string,
  columnMap: FpColumnMap,
  options?: {
    readonly identifier?: string;
    readonly hasHeader?: boolean;
    readonly skipRows?: number;
    readonly delimiter?: string;
  },
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase
    .from('fp_parser')
    .insert({
      pod_id: podId,
      name: parseFpName(name),
      column_map: columnMap,
      identifier: options?.identifier,
      has_header: options?.hasHeader ?? true,
      skip_rows: options?.skipRows ?? 0,
      delimiter: options?.delimiter ?? ',',
    })
    .select('id')
    .single();
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    throw new Error('create parser returned no id');
  }
  return data.id;
}
