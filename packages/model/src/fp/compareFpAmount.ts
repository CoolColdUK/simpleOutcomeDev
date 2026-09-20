import {FpAmountOperator} from './fpAmountOperator';

const EQ_EPSILON = 0.01;

export default function compareFpAmount(
  actual: number,
  operator: FpAmountOperator,
  expected: number,
): boolean {
  switch (operator) {
    case FpAmountOperator.EQ:
      return Math.abs(actual - expected) < EQ_EPSILON;
    case FpAmountOperator.LT:
      return actual < expected;
    case FpAmountOperator.LTE:
      return actual <= expected;
    case FpAmountOperator.GT:
      return actual > expected;
    case FpAmountOperator.GTE:
      return actual >= expected;
  }
}
