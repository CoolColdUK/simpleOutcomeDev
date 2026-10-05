import {FpAmountOperator} from './fpAmountOperator';
import type {FpParsedAutoAssignRule} from './fpParsedAutoAssignRule';

const CLAUSE =
  /^(DESCRIPTION|RECIPIENT|AMOUNT)\s*(<=|>=|<|>|==|=)\s*(.+)$/i;

interface FpAmountClause {
  readonly operator: FpAmountOperator;
  readonly value: number;
}

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

function isMinOperator(operator: FpAmountOperator): boolean {
  return operator === FpAmountOperator.GT || operator === FpAmountOperator.GTE;
}

function isMaxOperator(operator: FpAmountOperator): boolean {
  return operator === FpAmountOperator.LT || operator === FpAmountOperator.LTE;
}

function resolveAmountClauses(clauses: readonly FpAmountClause[]): Pick<
  FpParsedAutoAssignRule,
  'amount' | 'amountOperator' | 'amountMin' | 'amountMinOperator' | 'amountMax' | 'amountMaxOperator'
> | undefined {
  if (clauses.length === 0) {
    return {};
  }
  if (clauses.length === 1) {
    const only = clauses[0];
    if (only === undefined) {
      return undefined;
    }
    return {amount: only.value, amountOperator: only.operator};
  }
  if (clauses.length !== 2) {
    return undefined;
  }
  const minClause = clauses.find((clause) => isMinOperator(clause.operator));
  const maxClause = clauses.find((clause) => isMaxOperator(clause.operator));
  if (minClause === undefined || maxClause === undefined) {
    return undefined;
  }
  return {
    amountMin: minClause.value,
    amountMinOperator: minClause.operator,
    amountMax: maxClause.value,
    amountMaxOperator: maxClause.operator,
  };
}

function hasAmountConstraint(rule: FpParsedAutoAssignRule): boolean {
  return rule.amount !== undefined || rule.amountMin !== undefined || rule.amountMax !== undefined;
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
  const amountClauses: FpAmountClause[] = [];
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
      const operator = parseOperator(operatorRaw);
      const value = Number(valueRaw);
      if (operator === undefined || Number.isNaN(value)) {
        return false;
      }
      amountClauses.push({operator, value});
      return true;
    }
    return false;
  });
  const amountFields = resolveAmountClauses(amountClauses);
  if (!ok || amountFields === undefined) {
    return undefined;
  }
  const rule: FpParsedAutoAssignRule = {
    description,
    recipient,
    ...amountFields,
  };
  if (description === undefined && recipient === undefined && !hasAmountConstraint(rule)) {
    return undefined;
  }
  return rule;
}
