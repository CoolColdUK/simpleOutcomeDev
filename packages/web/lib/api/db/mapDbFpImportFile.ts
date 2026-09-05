export interface DbFpImportFile {
  readonly id: string;
  readonly importId: string;
  readonly fileName: string;
  readonly contentSha256: string;
  readonly parsed: number;
  readonly createdCount: number;
  readonly duplicateSkipped: number;
  readonly failed: number;
}

export function mapDbFpImportFile(row: {
  readonly id: string;
  readonly import_id: string;
  readonly file_name: string;
  readonly content_sha256: string;
  readonly parsed: number;
  readonly created_count: number;
  readonly duplicate_skipped: number;
  readonly failed: number;
}): DbFpImportFile {
  return {
    id: row.id,
    importId: row.import_id,
    fileName: row.file_name,
    contentSha256: row.content_sha256,
    parsed: row.parsed,
    createdCount: row.created_count,
    duplicateSkipped: row.duplicate_skipped,
    failed: row.failed,
  };
}
