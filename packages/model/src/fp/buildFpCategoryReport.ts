import {FpCategoryDirection} from './fpCategoryDirection';

export interface FpReportCategoryRow {
  readonly categoryId: string | undefined;
  readonly name: string;
  readonly direction: FpCategoryDirection | undefined;
  readonly amount: number;
}

export interface FpReportTotals {
  readonly income: number;
  readonly expense: number;
  readonly saving: number;
}

export interface FpReportInputTx {
  readonly id: string;
  readonly parentId?: string;
  readonly archived: boolean;
  readonly postedDate: string;
  readonly amount: number;
  readonly categoryId?: string;
}

export interface FpReportCategory {
  readonly id: string;
  readonly name: string;
  readonly direction: FpCategoryDirection;
}

export default function buildFpCategoryReport(
  transactions: readonly FpReportInputTx[],
  categories: readonly FpReportCategory[],
  startDate: string | undefined,
  endDate: string | undefined,
): {readonly totals: FpReportTotals; readonly rows: readonly FpReportCategoryRow[]} {
  const parentIdsWithChildren = new Set(
    transactions.flatMap((t) => (t.parentId !== undefined ? [t.parentId] : [])),
  );
  const byCategory = new Map<string | undefined, number>();
  const add = (id: string | undefined, amount: number): void => {
    byCategory.set(id, (byCategory.get(id) ?? 0) + amount);
  };
  transactions.forEach((tx) => {
    if (tx.archived) {
      return;
    }
    if (startDate !== undefined && tx.postedDate < startDate) {
      return;
    }
    if (endDate !== undefined && tx.postedDate > endDate) {
      return;
    }
    if (tx.parentId === undefined && parentIdsWithChildren.has(tx.id)) {
      return;
    }
    add(tx.categoryId, tx.amount);
  });
  const catById = new Map(categories.map((c) => [c.id, c]));
  const rows: FpReportCategoryRow[] = [...byCategory.entries()].map(([categoryId, amount]) => {
    const cat = categoryId === undefined ? undefined : catById.get(categoryId);
    return {
      categoryId,
      name: cat?.name ?? 'Uncategorised',
      direction: cat?.direction,
      amount,
    };
  });
  const totals = rows.reduce<FpReportTotals>(
    (acc, row) => {
      if (row.direction === FpCategoryDirection.INCOME) {
        return {...acc, income: acc.income + row.amount};
      }
      if (row.direction === FpCategoryDirection.EXPENSE) {
        return {...acc, expense: acc.expense + row.amount};
      }
      if (row.direction === FpCategoryDirection.SAVING) {
        return {...acc, saving: acc.saving + row.amount};
      }
      if (row.direction === undefined) {
        return row.amount < 0 ? {...acc, expense: acc.expense + row.amount} : {...acc, income: acc.income + row.amount};
      }
      return acc;
    },
    {income: 0, expense: 0, saving: 0},
  );
  return {totals, rows};
}
