import {FpAccountKind} from '@so/model';

export interface DbFpAccount {
  readonly id: string;
  readonly podId: string;
  readonly name: string;
  readonly kind: FpAccountKind;
  readonly openingFund: number;
  readonly archived: boolean;
  readonly notes?: string;
}

export function mapDbFpAccount(row: {
  readonly id: string;
  readonly pod_id: string;
  readonly name: string;
  readonly kind: string;
  readonly opening_fund: string;
  readonly archived: boolean;
  readonly notes: string | null;
}): DbFpAccount {
  return {
    id: row.id,
    podId: row.pod_id,
    name: row.name,
    kind: row.kind as FpAccountKind,
    openingFund: Number(row.opening_fund),
    archived: row.archived,
    notes: row.notes ?? undefined,
  };
}
