import matchFpAutoAssignCategory, {
  type FpAutoAssignTarget,
  type FpCategoryRule,
} from './matchFpAutoAssignCategory';

export interface FpAutoAssignPreviewInputTx extends FpAutoAssignTarget {
  readonly id: string;
  readonly postedDate: string;
  readonly archived: boolean;
  readonly categoryId?: string;
}

export interface FpAutoAssignPreviewRow {
  readonly transactionId: string;
  readonly postedDate: string;
  readonly description: string;
  readonly recipient: string;
  readonly amount: number;
  readonly categoryId: string;
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
    const categoryId = matchFpAutoAssignCategory(
      {description: t.description, recipient: t.recipient, amount: t.amount},
      rules,
    );
    return categoryId === undefined
      ? []
      : [
          {
            transactionId: t.id,
            postedDate: t.postedDate,
            description: t.description,
            recipient: t.recipient,
            amount: t.amount,
            categoryId,
          },
        ];
  });
}
