import {FpAmountOperator} from './fpAmountOperator';
import fpAmountOperatorSymbol from './fpAmountOperatorSymbol';
import type {FpParsedAutoAssignRule} from './fpParsedAutoAssignRule';

export default function formatFpAutoAssignRule(rule: FpParsedAutoAssignRule): string | undefined {
  const parts: string[] = [];
  const description = rule.description?.trim();
  if (description !== undefined && description !== '') {
    parts.push(`DESCRIPTION=${description}`);
  }
  const recipient = rule.recipient?.trim();
  if (recipient !== undefined && recipient !== '') {
    parts.push(`RECIPIENT=${recipient}`);
  }
  if (rule.amountMin !== undefined && !Number.isNaN(rule.amountMin)) {
    const operator = rule.amountMinOperator ?? FpAmountOperator.GTE;
    parts.push(`AMOUNT${fpAmountOperatorSymbol(operator)}${rule.amountMin}`);
  }
  if (rule.amountMax !== undefined && !Number.isNaN(rule.amountMax)) {
    const operator = rule.amountMaxOperator ?? FpAmountOperator.LTE;
    parts.push(`AMOUNT${fpAmountOperatorSymbol(operator)}${rule.amountMax}`);
  }
  if (rule.amount !== undefined && !Number.isNaN(rule.amount)) {
    const operator = rule.amountOperator ?? FpAmountOperator.EQ;
    parts.push(`AMOUNT${fpAmountOperatorSymbol(operator)}${rule.amount}`);
  }
  if (parts.length === 0) {
    return undefined;
  }
  return parts.join(',');
}
