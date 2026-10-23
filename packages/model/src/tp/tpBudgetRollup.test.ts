import {TpActionKind} from './tpActionKind';
import tpBudgetRollup from './tpBudgetRollup';

describe('tpBudgetRollup', () => {
  it('sums non-travel action costs once', () => {
    const total = tpBudgetRollup(
      [{kind: TpActionKind.ACTIVITY, costAmount: 40}, {kind: TpActionKind.NOTE, costAmount: 5}],
      [],
    );
    expect(total).toBe(45);
  });

  it('sums selected route transport costs for travel', () => {
    const total = tpBudgetRollup(
      [{kind: TpActionKind.TRAVEL, selectedRouteId: 'r1'}],
      [{routeId: 'r1', costAmount: 100}, {routeId: 'r1', costAmount: 20}, {routeId: 'r2', costAmount: 999}],
    );
    expect(total).toBe(120);
  });

  it('uses travel action cost when set instead of route legs', () => {
    const total = tpBudgetRollup(
      [{kind: TpActionKind.TRAVEL, selectedRouteId: 'r1', costAmount: 50}],
      [{routeId: 'r1', costAmount: 100}],
    );
    expect(total).toBe(50);
  });
});
