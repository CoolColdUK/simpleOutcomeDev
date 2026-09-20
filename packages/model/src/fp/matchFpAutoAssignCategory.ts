import compareFpAmount from './compareFpAmount';
import {FpAmountOperator} from './fpAmountOperator';
import parseFpAutoAssignRule from './parseFpAutoAssignRule';

/** Stored auto-assign rule string, e.g. `RECIPIENT=H,AMOUNT<50`. */
export type FpCategoryFilter = string;

export interface FpCategoryRule {
  readonly id: string;
  readonly filters: readonly FpCategoryFilter[];
  readonly isGroup?: boolean;
}

export interface FpAutoAssignTarget {
  readonly description: string;
  readonly recipient: string;
  readonly amount: number;
}

function containsPartial(haystack: string, needle: string): boolean {
  return needle !== '' && haystack.toLowerCase().includes(needle.toLowerCase());
}

function filterMatches(tx: FpAutoAssignTarget, filter: FpCategoryFilter): boolean {
  const rule = parseFpAutoAssignRule(filter);
  if (rule === undefined) {
    return false;
  }
  if (rule.description !== undefined && !containsPartial(tx.description, rule.description)) {
    return false;
  }
  if (rule.recipient !== undefined && !containsPartial(tx.recipient, rule.recipient)) {
    return false;
  }
  if (rule.amount !== undefined) {
    const operator = rule.amountOperator ?? FpAmountOperator.EQ;
    if (!compareFpAmount(tx.amount, operator, rule.amount)) {
      return false;
    }
  }
  return true;
}

export default function matchFpAutoAssignCategory(
  tx: FpAutoAssignTarget,
  categories: readonly FpCategoryRule[],
): string | undefined {
  const matched = categories.filter(
    (cat) => cat.isGroup !== true && cat.filters.some((f) => filterMatches(tx, f)),
  );
  if (matched.length !== 1) {
    return undefined;
  }
  return matched[0]?.id;
}
