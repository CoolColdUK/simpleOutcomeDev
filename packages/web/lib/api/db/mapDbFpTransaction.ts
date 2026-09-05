import {FpSplitRecurrence} from '@so/model';

export interface DbFpTransaction {
  readonly id: string;
  readonly podId: string;
  readonly accountId: string;
  readonly postedDate: string;
  readonly postedTime?: string;
  readonly amount: number;
  readonly description: string;
  readonly recipient: string;
  readonly notes: string;
  readonly externalId?: string;
  readonly categoryId?: string;
  readonly confirmed: boolean;
  readonly parserId?: string;
  readonly importId?: string;
  readonly archived: boolean;
  readonly parentId?: string;
  readonly splitPortionCount?: number;
  readonly splitRecurrence?: FpSplitRecurrence;
  readonly createdBy: string;
}

export function mapDbFpTransaction(row: {
  readonly id: string;
  readonly pod_id: string;
  readonly account_id: string;
  readonly posted_date: string;
  readonly posted_time: string | null;
  readonly amount: string;
  readonly description: string;
  readonly recipient: string;
  readonly notes: string;
  readonly external_id: string | null;
  readonly category_id: string | null;
  readonly confirmed: boolean;
  readonly parser_id: string | null;
  readonly import_id: string | null;
  readonly archived: boolean;
  readonly parent_id: string | null;
  readonly split_portion_count: number | null;
  readonly split_recurrence: string | null;
  readonly created_by: string;
}): DbFpTransaction {
  return {
    id: row.id,
    podId: row.pod_id,
    accountId: row.account_id,
    postedDate: row.posted_date,
    postedTime: row.posted_time ?? undefined,
    amount: Number(row.amount),
    description: row.description,
    recipient: row.recipient,
    notes: row.notes,
    externalId: row.external_id ?? undefined,
    categoryId: row.category_id ?? undefined,
    confirmed: row.confirmed,
    parserId: row.parser_id ?? undefined,
    importId: row.import_id ?? undefined,
    archived: row.archived,
    parentId: row.parent_id ?? undefined,
    splitPortionCount: row.split_portion_count ?? undefined,
    splitRecurrence: row.split_recurrence === null ? undefined : (row.split_recurrence as FpSplitRecurrence),
    createdBy: row.created_by,
  };
}
