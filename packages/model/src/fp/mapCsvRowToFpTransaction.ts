import tryMapCsvRowToFpTransaction from './tryMapCsvRowToFpTransaction';
import type {FpColumnMap} from './fpColumnMap';
import type {FpParsedTransaction} from './fpParsedTransaction';

export default function mapCsvRowToFpTransaction(
  row: Record<string, string>,
  columnMap: FpColumnMap,
): FpParsedTransaction | undefined {
  const result = tryMapCsvRowToFpTransaction(row, columnMap);
  if (!result.ok) {
    return undefined;
  }
  return result.transaction;
}
