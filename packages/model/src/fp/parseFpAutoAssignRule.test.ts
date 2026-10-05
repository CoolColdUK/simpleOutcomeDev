import {FpAmountOperator} from './fpAmountOperator';
import parseFpAutoAssignRule from './parseFpAutoAssignRule';

describe('parseFpAutoAssignRule', () => {
  it('parses mixed fields and amount operators', () => {
    expect(parseFpAutoAssignRule('RECIPIENT=someone,DESCRIPTION=test,amount<50')).toEqual({
      description: 'test',
      recipient: 'someone',
      amount: 50,
      amountOperator: FpAmountOperator.LT,
    });
  });

  it('parses amount range with two AMOUNT clauses', () => {
    expect(parseFpAutoAssignRule('AMOUNT>=-200,AMOUNT<=-5')).toEqual({
      amountMin: -200,
      amountMinOperator: FpAmountOperator.GTE,
      amountMax: -5,
      amountMaxOperator: FpAmountOperator.LTE,
    });
  });

  it('rejects empty or invalid input', () => {
    expect(parseFpAutoAssignRule('')).toBeUndefined();
    expect(parseFpAutoAssignRule('FOO=bar')).toBeUndefined();
    expect(parseFpAutoAssignRule('DESCRIPTION<x')).toBeUndefined();
    expect(parseFpAutoAssignRule('AMOUNT=abc')).toBeUndefined();
    expect(parseFpAutoAssignRule('AMOUNT=-10,AMOUNT>=-20')).toBeUndefined();
  });
});
