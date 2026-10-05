import compareFpAmount from './compareFpAmount';
import {FpAmountOperator} from './fpAmountOperator';
import type {FpParsedAutoAssignRule} from './fpParsedAutoAssignRule';

export default function matchesFpAutoAssignAmount(
  actual: number,
  rule: FpParsedAutoAssignRule,
): boolean {
  if (rule.amount !== undefined) {
    const operator = rule.amountOperator ?? FpAmountOperator.EQ;
    if (!compareFpAmount(actual, operator, rule.amount)) {
      return false;
    }
  }
  if (rule.amountMin !== undefined) {
    const operator = rule.amountMinOperator ?? FpAmountOperator.GTE;
    if (!compareFpAmount(actual, operator, rule.amountMin)) {
      return false;
    }
  }
  if (rule.amountMax !== undefined) {
    const operator = rule.amountMaxOperator ?? FpAmountOperator.LTE;
    if (!compareFpAmount(actual, operator, rule.amountMax)) {
      return false;
    }
  }
  return true;
}
