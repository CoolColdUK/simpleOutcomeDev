export interface DbFpImport {
  readonly id: string;
  readonly podId: string;
  readonly parserId?: string;
  readonly accountId: string;
  readonly createdAt: string;
  readonly undoneAt?: string;
}

export function mapDbFpImport(row: {
  readonly id: string;
  readonly pod_id: string;
  readonly parser_id: string | null;
  readonly account_id: string;
  readonly created_at: string;
  readonly undone_at: string | null;
}): DbFpImport {
  return {
    id: row.id,
    podId: row.pod_id,
    parserId: row.parser_id ?? undefined,
    accountId: row.account_id,
    createdAt: row.created_at,
    undoneAt: row.undone_at ?? undefined,
  };
}
