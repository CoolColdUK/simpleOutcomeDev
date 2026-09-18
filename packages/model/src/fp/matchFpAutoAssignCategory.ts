export interface FpCategoryFilter {
  readonly descriptionContains?: readonly string[];
  readonly recipientContains?: readonly string[];
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

function containsAny(haystack: string, needles: readonly string[]): boolean {
  const lower = haystack.toLowerCase();
  return needles.some((needle) => needle !== '' && lower.includes(needle.toLowerCase()));
}

function filterMatches(tx: FpAutoAssignTarget, filter: FpCategoryFilter): boolean {
  const descriptionContains = filter.descriptionContains ?? [];
  const recipientContains = filter.recipientContains ?? [];
  const amount = filter.amount;
  const hasDescription = descriptionContains.length > 0;
  const hasRecipient = recipientContains.length > 0;
  const hasAmount = amount !== undefined;
  if (!hasDescription && !hasRecipient && !hasAmount) {
    return false;
  }
  if (hasDescription && !containsAny(tx.description, descriptionContains)) {
    return false;
  }
  if (hasRecipient && !containsAny(tx.recipient, recipientContains)) {
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
