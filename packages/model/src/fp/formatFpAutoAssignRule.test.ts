import {FpAmountOperator} from './fpAmountOperator';
import formatFpAutoAssignRule from './formatFpAutoAssignRule';

describe('formatFpAutoAssignRule', () => {
  it('builds a comma-joined rule with optional fields', () => {
    expect(
      formatFpAutoAssignRule({
        description: 'test',
        recipient: 'someone',
        amount: 50,
        amountOperator: FpAmountOperator.LT,
      }),
    ).toBe('DESCRIPTION=test,RECIPIENT=someone,AMOUNT<50');
  });

  it('returns undefined when nothing is set', () => {
    expect(formatFpAutoAssignRule({})).toBeUndefined();
    expect(formatFpAutoAssignRule({description: '  '})).toBeUndefined();
  });
});
