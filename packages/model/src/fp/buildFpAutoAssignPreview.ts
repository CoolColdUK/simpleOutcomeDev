import {
  listFpAutoAssignCategoryMatches,
  type FpAutoAssignTarget,
  type FpCategoryRule,
} from './matchFpAutoAssignCategory';

export interface FpAutoAssignPreviewInputTx extends FpAutoAssignTarget {
  readonly id: string;
  readonly accountId: string;
  readonly postedDate: string;
  readonly archived: boolean;
  readonly categoryId?: string;
}

interface FpAutoAssignPreviewRowBase {
  readonly transactionId: string;
  readonly accountId: string;
  readonly postedDate: string;
  readonly description: string;
  readonly recipient: string;
  readonly amount: number;
}

export interface FpAutoAssignPreviewRowUnique extends FpAutoAssignPreviewRowBase {
  readonly kind: 'unique';
  readonly categoryId: string;
}

export interface FpAutoAssignPreviewRowAmbiguous extends FpAutoAssignPreviewRowBase {
  readonly kind: 'ambiguous';
  readonly categoryIds: readonly string[];
}

export type FpAutoAssignPreviewRow = FpAutoAssignPreviewRowUnique | FpAutoAssignPreviewRowAmbiguous;

function baseRow(t: FpAutoAssignPreviewInputTx): FpAutoAssignPreviewRowBase {
  return {
    transactionId: t.id,
    accountId: t.accountId,
    postedDate: t.postedDate,
    description: t.description,
    recipient: t.recipient,
    amount: t.amount,
  };
}

export default function buildFpAutoAssignPreview(
  transactions: readonly FpAutoAssignPreviewInputTx[],
  categories: readonly FpCategoryRule[],
): readonly FpAutoAssignPreviewRow[] {
  const rules = categories.map((c) => ({id: c.id, filters: c.filters, isGroup: c.isGroup}));
  return transactions.flatMap((t) => {
    if (t.archived || t.categoryId !== undefined) {
      return [];
    }
    const target = {description: t.description, recipient: t.recipient, amount: t.amount};
    const categoryIds = listFpAutoAssignCategoryMatches(target, rules);
    if (categoryIds.length === 0) {
      return [];
    }
    if (categoryIds.length === 1) {
      const categoryId = categoryIds[0];
      if (categoryId === undefined) {
        return [];
      }
      return [{...baseRow(t), kind: 'unique', categoryId}];
    }
    return [{...baseRow(t), kind: 'ambiguous', categoryIds}];
  });
}
