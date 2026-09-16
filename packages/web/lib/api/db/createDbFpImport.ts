import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';
import type {FpImportLogEntry, FpImportMappedRow, FpParsedTransaction} from '@so/model';

export interface CreateDbFpImportFile {
  readonly fileName: string;
  readonly contentSha256: string;
  readonly parsed: number;
  readonly rows: readonly FpImportMappedRow[];
  readonly logs: readonly FpImportLogEntry[];
}

function rowPayload(row: FpImportMappedRow): Record<string, string | number> {
  const tx: FpParsedTransaction = row.transaction;
  return {
    posted_date: tx.postedDate,
    posted_time: tx.postedTime ?? '',
    amount: String(tx.amount),
    description: tx.description,
    recipient: tx.recipient,
    external_id: tx.externalId ?? '',
    notes: tx.notes,
    row_index: row.rowIndex,
    file_line: row.fileLine,
  };
}

function logPayload(log: FpImportLogEntry): Record<string, string | number> {
  const base: Record<string, string | number> = {
    kind: log.kind,
    rowIndex: log.rowIndex,
    message: log.message,
  };
  if (log.fileLine !== undefined && log.raw !== undefined) {
    return {...base, fileLine: log.fileLine, raw: log.raw};
  }
  if (log.fileLine !== undefined) {
    return {...base, fileLine: log.fileLine};
  }
  if (log.raw !== undefined) {
    return {...base, raw: log.raw};
  }
  return base;
}

export default async function createDbFpImport(
  podId: string,
  parserId: string,
  accountId: string,
  file: CreateDbFpImportFile,
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {data, error} = await supabase.rpc('create_fp_import', {
    p_pod_id: podId,
    p_parser_id: parserId,
    p_account_id: accountId,
    p_files: [
      {
        file_name: file.fileName,
        content_sha256: file.contentSha256,
        parsed: file.parsed,
        logs: file.logs.map(logPayload),
        rows: file.rows.map(rowPayload),
      },
    ],
  });
  throwIfSupabaseError(error);
  if (data === undefined || data === null) {
    throw new Error('import returned no id');
  }
  return data;
}
