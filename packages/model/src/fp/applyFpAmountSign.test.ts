import applyFpAmountSign from './applyFpAmountSign';
import {FpAmountSign} from './fpAmountSign';

describe('applyFpAmountSign', () => {
  it('inverts', () => {
    expect(applyFpAmountSign(12, FpAmountSign.INVERT)).toBe(-12);
  });

  it('forces all negative', () => {
    expect(applyFpAmountSign(12, FpAmountSign.ALL_NEGATIVE)).toBe(-12);
    expect(applyFpAmountSign(-4, FpAmountSign.ALL_NEGATIVE)).toBe(-4);
  });

  it('leaves as-is', () => {
    expect(applyFpAmountSign(-3, FpAmountSign.AS_IS)).toBe(-3);
  });
});
