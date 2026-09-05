import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {FpParsedTransaction} from '@so/model';

export interface CreateDbFpImportFile {
  readonly fileName: string;
  readonly contentSha256: string;
  readonly rows: readonly FpParsedTransaction[];
}

export default async function createDbFpImport(
  podId: string,
  parserId: string,
  accountId: string,
  files: readonly CreateDbFpImportFile[],
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase.rpc('create_fp_import', {
    p_pod_id: podId,
    p_parser_id: parserId,
    p_account_id: accountId,
    p_files: files.map((f) => ({
      file_name: f.fileName,
      content_sha256: f.contentSha256,
      rows: f.rows.map((r) => ({
        posted_date: r.postedDate,
        posted_time: r.postedTime ?? '',
        amount: String(r.amount),
        description: r.description,
        recipient: r.recipient,
        external_id: r.externalId ?? '',
        notes: r.notes,
      })),
    })),
  });
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    throw new Error('import returned no id');
  }
  return data;
}
