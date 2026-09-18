import type {FpCategoryFilter} from './matchFpAutoAssignCategory';

function parsePatterns(input: unknown): readonly string[] | undefined {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed === '') {
      return undefined;
    }
    return [trimmed];
  }
  if (!Array.isArray(input)) {
    return undefined;
  }
  const values = input.flatMap((item) => {
    if (typeof item !== 'string') {
      return [];
    }
    const trimmed = item.trim();
    return trimmed === '' ? [] : [trimmed];
  });
  if (values.length === 0) {
    return undefined;
  }
  return values;
}

function parseOne(input: unknown): FpCategoryFilter | undefined {
  if (input === undefined || typeof input !== 'object' || input === null) {
    return undefined;
  }
  const raw = input as Record<string, unknown>;
  const descriptionContains = parsePatterns(raw['descriptionContains']);
  const recipientContains = parsePatterns(raw['recipientContains']);
  const amountRaw = raw['amount'];
  const amount = typeof amountRaw === 'number' && !Number.isNaN(amountRaw) ? amountRaw : undefined;
  if (descriptionContains === undefined && recipientContains === undefined && amount === undefined) {
    return undefined;
  }
  return {descriptionContains, recipientContains, amount};
}

export default function parseFpCategoryFilters(input: unknown): readonly FpCategoryFilter[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.flatMap((item) => {
    const filter = parseOne(item);
    return filter === undefined ? [] : [filter];
  });
}
