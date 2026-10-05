import {FpAmountOperator} from './fpAmountOperator';
import matchesFpAutoAssignAmount from './matchesFpAutoAssignAmount';

describe('matchesFpAutoAssignAmount', () => {
  it('matches an inclusive range', () => {
    expect(
      matchesFpAutoAssignAmount(-25, {
        amountMin: -100,
        amountMinOperator: FpAmountOperator.GTE,
        amountMax: -10,
        amountMaxOperator: FpAmountOperator.LTE,
      }),
    ).toBe(true);
    expect(
      matchesFpAutoAssignAmount(-5, {
        amountMin: -100,
        amountMax: -10,
      }),
    ).toBe(false);
  });
});
