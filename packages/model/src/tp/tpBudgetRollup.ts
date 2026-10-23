import {TpActionKind} from './tpActionKind';

export interface TpBudgetActionLine {
  readonly kind: TpActionKind;
  readonly costAmount?: number;
  readonly selectedRouteId?: string;
}

export interface TpBudgetTransportLine {
  readonly routeId: string;
  readonly costAmount?: number;
}

export default function tpBudgetRollup(
  actions: readonly TpBudgetActionLine[],
  transports: readonly TpBudgetTransportLine[],
): number {
  let total = 0;
  actions.forEach((action) => {
    if (action.kind === TpActionKind.TRAVEL) {
      if (action.costAmount !== undefined) {
        total += action.costAmount;
        return;
      }
      if (action.selectedRouteId === undefined) {
        return;
      }
      transports
        .filter((t) => t.routeId === action.selectedRouteId)
        .forEach((t) => {
          if (t.costAmount !== undefined) {
            total += t.costAmount;
          }
        });
      return;
    }
    if (action.costAmount !== undefined) {
      total += action.costAmount;
    }
  });
  return total;
}
