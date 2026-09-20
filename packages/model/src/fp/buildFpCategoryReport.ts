import {FpCategoryDirection} from './fpCategoryDirection';

export interface FpReportCategoryRow {
  readonly categoryId: string | undefined;
  readonly name: string;
  readonly direction: FpCategoryDirection | undefined;
  readonly amount: number;
  readonly isGroup?: boolean;
  readonly children?: readonly FpReportCategoryRow[];
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
  readonly isGroup?: boolean;
  readonly parentId?: string;
}

function leafRow(
  categoryId: string | undefined,
  amount: number,
  catById: Map<string, FpReportCategory>,
): FpReportCategoryRow {
  const cat = categoryId === undefined ? undefined : catById.get(categoryId);
  return {
    categoryId,
    name: cat?.name ?? 'Uncategorised',
    direction: cat?.direction,
    amount,
  };
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
  const leafAmounts = [...byCategory.entries()];
  const groupChildren = new Map<string, FpReportCategoryRow[]>();
  const topLevel: FpReportCategoryRow[] = [];
  leafAmounts.forEach(([categoryId, amount]) => {
    const row = leafRow(categoryId, amount, catById);
    const parentId = categoryId === undefined ? undefined : catById.get(categoryId)?.parentId;
    if (parentId === undefined) {
      topLevel.push(row);
      return;
    }
    const parent = catById.get(parentId);
    if (parent === undefined || parent.isGroup !== true) {
      topLevel.push(row);
      return;
    }
    const existing = groupChildren.get(parentId) ?? [];
    groupChildren.set(parentId, [...existing, row]);
  });
  const groupRows: FpReportCategoryRow[] = [...groupChildren.entries()].map(([groupId, children]) => {
    const group = catById.get(groupId);
    return {
      categoryId: groupId,
      name: group?.name ?? 'Group',
      direction: undefined,
      amount: children.reduce((sum, child) => sum + child.amount, 0),
      isGroup: true,
      children,
    };
  });
  const rows = [...groupRows, ...topLevel];
  const totals = leafAmounts.reduce<FpReportTotals>(
    (acc, [categoryId, amount]) => {
      const cat = categoryId === undefined ? undefined : catById.get(categoryId);
      const direction = cat?.direction;
      if (direction === FpCategoryDirection.INCOME) {
        return {...acc, income: acc.income + amount};
      }
      if (direction === FpCategoryDirection.EXPENSE) {
        return {...acc, expense: acc.expense + amount};
      }
      if (direction === FpCategoryDirection.SAVING) {
        return {...acc, saving: acc.saving + amount};
      }
      if (direction === undefined) {
        return amount < 0 ? {...acc, expense: acc.expense + amount} : {...acc, income: acc.income + amount};
      }
      return acc;
    },
    {income: 0, expense: 0, saving: 0},
  );
  return {totals, rows};
}
