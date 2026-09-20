import {FpAmountOperator} from './fpAmountOperator';
import compareFpAmount from './compareFpAmount';

describe('compareFpAmount', () => {
  it('compares with equality epsilon and inequalities', () => {
    expect(compareFpAmount(-15.99, FpAmountOperator.EQ, -15.99)).toBe(true);
    expect(compareFpAmount(-15.991, FpAmountOperator.EQ, -15.99)).toBe(true);
    expect(compareFpAmount(-16, FpAmountOperator.LT, -10)).toBe(true);
    expect(compareFpAmount(-10, FpAmountOperator.LTE, -10)).toBe(true);
    expect(compareFpAmount(5, FpAmountOperator.GT, 4)).toBe(true);
    expect(compareFpAmount(5, FpAmountOperator.GTE, 5)).toBe(true);
    expect(compareFpAmount(-9, FpAmountOperator.LT, -10)).toBe(false);
  });
});
