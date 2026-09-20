import {FpAmountOperator} from './fpAmountOperator';
import fpAmountOperatorLabel from './fpAmountOperatorLabel';

describe('fpAmountOperatorLabel', () => {
  it('returns human labels', () => {
    expect(fpAmountOperatorLabel(FpAmountOperator.EQ)).toBe('equal');
    expect(fpAmountOperatorLabel(FpAmountOperator.LT)).toBe('smaller');
    expect(fpAmountOperatorLabel(FpAmountOperator.LTE)).toBe('smaller or equal');
    expect(fpAmountOperatorLabel(FpAmountOperator.GT)).toBe('larger');
    expect(fpAmountOperatorLabel(FpAmountOperator.GTE)).toBe('larger or equal');
  });
});
