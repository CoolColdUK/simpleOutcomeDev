import {TpActionKind} from './tpActionKind';
import tpBudgetRollup from './tpBudgetRollup';

describe('tpBudgetRollup', () => {
  it('sums non-travel action costs once', () => {
    const total = tpBudgetRollup(
      [{kind: TpActionKind.ACTIVITY, costAmount: 40}, {kind: TpActionKind.NOTE, costAmount: 5}],
      [],
      [],
    );
    expect(total).toBe(45);
  });

  it('sums selected route transport costs for travel when route has no price', () => {
    const total = tpBudgetRollup(
      [{kind: TpActionKind.TRAVEL, selectedRouteId: 'r1'}],
      [{id: 'r1'}],
      [{routeId: 'r1', costAmount: 100}, {routeId: 'r1', costAmount: 20}, {routeId: 'r2', costAmount: 999}],
    );
    expect(total).toBe(120);
  });

  it('uses selected route cost and ignores step costs on that route', () => {
    const total = tpBudgetRollup(
      [{kind: TpActionKind.TRAVEL, selectedRouteId: 'r1'}],
      [{id: 'r1', costAmount: 75}],
      [{routeId: 'r1', costAmount: 100}],
    );
    expect(total).toBe(75);
  });

  it('uses travel action cost when route has no price', () => {
    const total = tpBudgetRollup(
      [{kind: TpActionKind.TRAVEL, selectedRouteId: 'r1', costAmount: 50}],
      [{id: 'r1'}],
      [{routeId: 'r1', costAmount: 100}],
    );
    expect(total).toBe(50);
  });

  it('prefers route cost over action cost', () => {
    const total = tpBudgetRollup(
      [{kind: TpActionKind.TRAVEL, selectedRouteId: 'r1', costAmount: 50}],
      [{id: 'r1', costAmount: 80}],
      [],
    );
    expect(total).toBe(80);
  });
});
