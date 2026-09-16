import applyFpAmountSign from './applyFpAmountSign';
import {FpAmountSign} from './fpAmountSign';
import {FpColumnTarget} from './fpColumnTarget';
import type {FpColumnMapping} from './fpColumnMap';
import parseFpAmount from './parseFpAmount';
import parsePostedDate from './parsePostedDate';

function previewFromRaw(raw: string, target: FpColumnTarget, mapping: FpColumnMapping): string | undefined {
  if (target === FpColumnTarget.DATE) {
    return parsePostedDate(raw, mapping.dateFormat ?? 'YYYY-MM-DD');
  }
  if (target === FpColumnTarget.AMOUNT) {
    const amount = parseFpAmount(raw);
    if (amount === undefined) {
      return undefined;
    }
    return String(applyFpAmountSign(amount, mapping.sign ?? FpAmountSign.AS_IS));
  }
  const trimmed = raw.trim();
  return trimmed === '' ? undefined : trimmed;
}

export default function previewFpMappedField(
  rows: readonly Record<string, string>[],
  target: FpColumnTarget,
  mapping: FpColumnMapping | undefined,
): string | undefined {
  if (mapping === undefined) {
    return undefined;
  }
  const values = rows.flatMap((row) => {
    const preview = previewFromRaw(row[mapping.column] ?? '', target, mapping);
    return preview === undefined ? [] : [preview];
  });
  return values[0];
}
