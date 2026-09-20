import {FpAmountOperator} from './fpAmountOperator';
import type {FpParsedAutoAssignRule} from './fpParsedAutoAssignRule';

const CLAUSE =
  /^(DESCRIPTION|RECIPIENT|AMOUNT)\s*(<=|>=|<|>|==|=)\s*(.+)$/i;

function parseOperator(raw: string): FpAmountOperator | undefined {
  switch (raw) {
    case '=':
    case '==':
      return FpAmountOperator.EQ;
    case '<':
      return FpAmountOperator.LT;
    case '<=':
      return FpAmountOperator.LTE;
    case '>':
      return FpAmountOperator.GT;
    case '>=':
      return FpAmountOperator.GTE;
    default:
      return undefined;
  }
}

export default function parseFpAutoAssignRule(input: string): FpParsedAutoAssignRule | undefined {
  const trimmed = input.trim();
  if (trimmed === '') {
    return undefined;
  }
  const clauses = trimmed.split(',').map((part) => part.trim()).filter((part) => part !== '');
  if (clauses.length === 0) {
    return undefined;
  }
  let description: string | undefined;
  let recipient: string | undefined;
  let amount: number | undefined;
  let amountOperator: FpAmountOperator | undefined;
  const ok = clauses.every((clause) => {
    const match = CLAUSE.exec(clause);
    if (match === null) {
      return false;
    }
    const field = match[1]?.toUpperCase();
    const operatorRaw = match[2];
    const valueRaw = match[3]?.trim();
    if (field === undefined || operatorRaw === undefined || valueRaw === undefined || valueRaw === '') {
      return false;
    }
    if (field === 'DESCRIPTION') {
      if (operatorRaw !== '=' && operatorRaw !== '==') {
        return false;
      }
      if (description !== undefined) {
        return false;
      }
      description = valueRaw;
      return true;
    }
    if (field === 'RECIPIENT') {
      if (operatorRaw !== '=' && operatorRaw !== '==') {
        return false;
      }
      if (recipient !== undefined) {
        return false;
      }
      recipient = valueRaw;
      return true;
    }
    if (field === 'AMOUNT') {
      if (amount !== undefined) {
        return false;
      }
      const operator = parseOperator(operatorRaw);
      const value = Number(valueRaw);
      if (operator === undefined || Number.isNaN(value)) {
        return false;
      }
      amount = value;
      amountOperator = operator;
      return true;
    }
    return false;
  });
  if (!ok || (description === undefined && recipient === undefined && amount === undefined)) {
    return undefined;
  }
  return {description, recipient, amount, amountOperator};
}
