import {FpAmountOperator} from './fpAmountOperator';
import formatFpAutoAssignRule from './formatFpAutoAssignRule';
import parseFpAutoAssignRule from './parseFpAutoAssignRule';
import type {FpCategoryFilter} from './matchFpAutoAssignCategory';

function parsePatterns(input: unknown): readonly string[] {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    return trimmed === '' ? [] : [trimmed];
  }
  if (!Array.isArray(input)) {
    return [];
  }
  return input.flatMap((item) => {
    if (typeof item !== 'string') {
      return [];
    }
    const trimmed = item.trim();
    return trimmed === '' ? [] : [trimmed];
  });
}

function fromLegacyObject(input: Record<string, unknown>): readonly FpCategoryFilter[] {
  const descriptions = parsePatterns(input['descriptionContains']);
  const recipients = parsePatterns(input['recipientContains']);
  const amountRaw = input['amount'];
  const amount = typeof amountRaw === 'number' && !Number.isNaN(amountRaw) ? amountRaw : undefined;
  const descriptionOptions = descriptions.length === 0 ? [undefined] : descriptions;
  const recipientOptions = recipients.length === 0 ? [undefined] : recipients;
  return descriptionOptions.flatMap((description) =>
    recipientOptions.flatMap((recipient) => {
      if (description === undefined && recipient === undefined && amount === undefined) {
        return [];
      }
      const formatted = formatFpAutoAssignRule({
        description,
        recipient,
        amount,
        amountOperator: amount === undefined ? undefined : FpAmountOperator.EQ,
      });
      return formatted === undefined ? [] : [formatted];
    }),
  );
}

function fromString(input: string): readonly FpCategoryFilter[] {
  const parsed = parseFpAutoAssignRule(input);
  if (parsed === undefined) {
    return [];
  }
  const formatted = formatFpAutoAssignRule(parsed);
  return formatted === undefined ? [] : [formatted];
}

export default function parseFpCategoryFilters(input: unknown): readonly FpCategoryFilter[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.flatMap((item) => {
    if (typeof item === 'string') {
      return fromString(item);
    }
    if (item !== undefined && typeof item === 'object' && item !== null) {
      return fromLegacyObject(item as Record<string, unknown>);
    }
    return [];
  });
}
