import {FpAmountOperator} from './fpAmountOperator';

export default function fpAmountOperatorSymbol(operator: FpAmountOperator): string {
  switch (operator) {
    case FpAmountOperator.EQ:
      return '=';
    case FpAmountOperator.LT:
      return '<';
    case FpAmountOperator.LTE:
      return '<=';
    case FpAmountOperator.GT:
      return '>';
    case FpAmountOperator.GTE:
      return '>=';
  }
}
