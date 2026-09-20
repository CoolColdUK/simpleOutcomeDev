import {FpAmountOperator} from './fpAmountOperator';
import fpAmountOperatorSymbol from './fpAmountOperatorSymbol';

describe('fpAmountOperatorSymbol', () => {
  it('returns comparison symbols', () => {
    expect(fpAmountOperatorSymbol(FpAmountOperator.EQ)).toBe('=');
    expect(fpAmountOperatorSymbol(FpAmountOperator.LT)).toBe('<');
    expect(fpAmountOperatorSymbol(FpAmountOperator.LTE)).toBe('<=');
    expect(fpAmountOperatorSymbol(FpAmountOperator.GT)).toBe('>');
    expect(fpAmountOperatorSymbol(FpAmountOperator.GTE)).toBe('>=');
  });
});
