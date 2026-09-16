import applyFpAmountSign from './applyFpAmountSign';
import {FpAmountSign} from './fpAmountSign';
import {FpColumnTarget} from './fpColumnTarget';
import type {FpColumnMap} from './fpColumnMap';
import type {FpParsedTransaction} from './fpParsedTransaction';
import parseFpAmount from './parseFpAmount';
import parsePostedDate from './parsePostedDate';

export type TryMapCsvRowToFpTransactionResult =
  | {readonly ok: true; readonly transaction: FpParsedTransaction}
  | {readonly ok: false; readonly reason: string};

function cell(row: Record<string, string>, column: string | undefined): string {
  if (column === undefined) {
    return '';
  }
  return row[column] ?? '';
}

export default function tryMapCsvRowToFpTransaction(
  row: Record<string, string>,
  columnMap: FpColumnMap,
): TryMapCsvRowToFpTransactionResult {
  const dateMap = columnMap[FpColumnTarget.DATE];
  const amountMap = columnMap[FpColumnTarget.AMOUNT];
  if (dateMap === undefined) {
    return {ok: false, reason: 'Date column is not mapped'};
  }
  if (amountMap === undefined) {
    return {ok: false, reason: 'Amount column is not mapped'};
  }
  const dateRaw = cell(row, dateMap.column);
  const dateFormat = dateMap.dateFormat ?? 'YYYY-MM-DD';
  const postedDate = parsePostedDate(dateRaw, dateFormat);
  if (postedDate === undefined) {
    return {ok: false, reason: `Could not parse date "${dateRaw}" with format ${dateFormat}`};
  }
  const amountRaw = cell(row, amountMap.column);
  const rawAmount = parseFpAmount(amountRaw);
  if (rawAmount === undefined) {
    return {ok: false, reason: `Could not parse amount "${amountRaw}"`};
  }
  const timeRaw = cell(row, columnMap[FpColumnTarget.TIME]?.column).trim();
  const externalRaw = cell(row, columnMap[FpColumnTarget.EXTERNAL_ID]?.column).trim();
  return {
    ok: true,
    transaction: {
      postedDate,
      postedTime: timeRaw === '' ? undefined : timeRaw,
      amount: applyFpAmountSign(rawAmount, amountMap.sign ?? FpAmountSign.AS_IS),
      description: cell(row, columnMap[FpColumnTarget.DESCRIPTION]?.column).trim(),
      recipient: cell(row, columnMap[FpColumnTarget.RECIPIENT]?.column).trim(),
      externalId: externalRaw === '' ? undefined : externalRaw,
      notes: cell(row, columnMap[FpColumnTarget.NOTES]?.column).trim(),
    },
  };
}
