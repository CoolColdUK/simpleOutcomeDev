import {FpBudgetPeriod, FpCategoryDirection, type FpCategoryFilter} from '@so/model';

export interface DbFpCategory {
  readonly id: string;
  readonly podId: string;
  readonly name: string;
  readonly direction: FpCategoryDirection;
  readonly budgetAmount?: number;
  readonly budgetPeriod?: FpBudgetPeriod;
  readonly favourite: boolean;
  readonly sortOrder: number;
  readonly colour?: string;
  readonly filters: readonly FpCategoryFilter[];
}

export function mapDbFpCategory(row: {
  readonly id: string;
  readonly pod_id: string;
  readonly name: string;
  readonly direction: string;
  readonly budget_amount: string | null;
  readonly budget_period: string | null;
  readonly favourite: boolean;
  readonly sort_order: number;
  readonly colour: string | null;
  readonly filters: unknown;
}): DbFpCategory {
  const filters = Array.isArray(row.filters) ? (row.filters as FpCategoryFilter[]) : [];
  return {
    id: row.id,
    podId: row.pod_id,
    name: row.name,
    direction: row.direction as FpCategoryDirection,
    budgetAmount: row.budget_amount === null ? undefined : Number(row.budget_amount),
    budgetPeriod: row.budget_period === null ? undefined : (row.budget_period as FpBudgetPeriod),
    favourite: row.favourite,
    sortOrder: row.sort_order,
    colour: row.colour ?? undefined,
    filters,
  };
}
