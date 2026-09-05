export interface FpCategoryFilter {
  readonly descriptionContains?: string;
  readonly recipientContains?: string;
  readonly amount?: number;
}

export interface FpCategoryRule {
  readonly id: string;
  readonly filters: readonly FpCategoryFilter[];
}

export interface FpAutoAssignTarget {
  readonly description: string;
  readonly recipient: string;
  readonly amount: number;
}

function filterMatches(tx: FpAutoAssignTarget, filter: FpCategoryFilter): boolean {
  const descriptionContains = filter.descriptionContains;
  const recipientContains = filter.recipientContains;
  const amount = filter.amount;
  const hasDescription = descriptionContains !== undefined && descriptionContains !== '';
  const hasRecipient = recipientContains !== undefined && recipientContains !== '';
  const hasAmount = amount !== undefined;
  if (!hasDescription && !hasRecipient && !hasAmount) {
    return false;
  }
  if (hasDescription && descriptionContains !== undefined && !tx.description.toLowerCase().includes(descriptionContains.toLowerCase())) {
    return false;
  }
  if (hasRecipient && recipientContains !== undefined && !tx.recipient.toLowerCase().includes(recipientContains.toLowerCase())) {
    return false;
  }
  if (hasAmount && amount !== undefined && Math.abs(tx.amount - amount) >= 0.01) {
    return false;
  }
  return true;
}

export default function matchFpAutoAssignCategory(
  tx: FpAutoAssignTarget,
  categories: readonly FpCategoryRule[],
): string | undefined {
  const matched = categories.filter((cat) => cat.filters.some((f) => filterMatches(tx, f)));
  if (matched.length !== 1) {
    return undefined;
  }
  return matched[0]?.id;
}
