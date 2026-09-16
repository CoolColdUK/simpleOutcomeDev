import fpAmountSignLabel from './fpAmountSignLabel';
import {FpAmountSign} from './fpAmountSign';

describe('fpAmountSignLabel', () => {
  it('labels invert', () => {
    expect(fpAmountSignLabel(FpAmountSign.INVERT)).toBe('Invert sign');
  });
});
