import {parseFpCurrency, parseFpPermissionMatrix, type FpPermissionMatrix} from '@so/model';

export interface DbFpSetting {
  readonly podId: string;
  readonly currency: string;
  readonly permission: FpPermissionMatrix;
}

export function mapDbFpSetting(row: {
  readonly pod_id: string;
  readonly currency: string;
  readonly permission: Record<string, unknown>;
}): DbFpSetting {
  return {
    podId: row.pod_id,
    currency: parseFpCurrency(row.currency),
    permission: parseFpPermissionMatrix(row.permission),
  };
}
