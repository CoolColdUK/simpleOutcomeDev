import applyFpAmountSign from './applyFpAmountSign';
import {FpAmountSign} from './fpAmountSign';
import {FpColumnTarget} from './fpColumnTarget';
import type {FpColumnMap} from './fpColumnMap';
import type {FpParsedTransaction} from './fpParsedTransaction';
import parseFpAmount from './parseFpAmount';
import parsePostedDate from './parsePostedDate';

function cell(row: Record<string, string>, column: string | undefined): string {
  if (column === undefined) {
    return '';
  }
  return row[column] ?? '';
}

export default function mapCsvRowToFpTransaction(
  row: Record<string, string>,
  columnMap: FpColumnMap,
): FpParsedTransaction | undefined {
  const dateMap = columnMap[FpColumnTarget.DATE];
  const amountMap = columnMap[FpColumnTarget.AMOUNT];
  if (dateMap === undefined || amountMap === undefined) {
    return undefined;
  }
  const postedDate = parsePostedDate(cell(row, dateMap.column), dateMap.dateFormat ?? 'YYYY-MM-DD');
  const rawAmount = parseFpAmount(cell(row, amountMap.column));
  if (postedDate === undefined || rawAmount === undefined) {
    return undefined;
  }
  const timeRaw = cell(row, columnMap[FpColumnTarget.TIME]?.column).trim();
  const externalRaw = cell(row, columnMap[FpColumnTarget.EXTERNAL_ID]?.column).trim();
  return {
    postedDate,
    postedTime: timeRaw === '' ? undefined : timeRaw,
    amount: applyFpAmountSign(rawAmount, amountMap.sign ?? FpAmountSign.AS_IS),
    description: cell(row, columnMap[FpColumnTarget.DESCRIPTION]?.column).trim(),
    recipient: cell(row, columnMap[FpColumnTarget.RECIPIENT]?.column).trim(),
    externalId: externalRaw === '' ? undefined : externalRaw,
    notes: cell(row, columnMap[FpColumnTarget.NOTES]?.column).trim(),
  };
}
