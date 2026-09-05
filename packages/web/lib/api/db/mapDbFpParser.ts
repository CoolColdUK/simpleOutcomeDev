import type {FpColumnMap} from '@so/model';

export interface DbFpParser {
  readonly id: string;
  readonly podId: string;
  readonly name: string;
  readonly identifier?: string;
  readonly hasHeader: boolean;
  readonly skipRows: number;
  readonly delimiter: string;
  readonly columnMap: FpColumnMap;
}

export function mapDbFpParser(row: {
  readonly id: string;
  readonly pod_id: string;
  readonly name: string;
  readonly identifier: string | null;
  readonly has_header: boolean;
  readonly skip_rows: number;
  readonly delimiter: string;
  readonly column_map: unknown;
}): DbFpParser {
  return {
    id: row.id,
    podId: row.pod_id,
    name: row.name,
    identifier: row.identifier ?? undefined,
    hasHeader: row.has_header,
    skipRows: row.skip_rows,
    delimiter: row.delimiter,
    columnMap: (row.column_map ?? {}) as FpColumnMap,
  };
}
