import {FpImportLogKind} from './fpImportLogKind';
import type {FpImportLogEntry} from './fpImportLogEntry';
import type {FpColumnMap} from './fpColumnMap';
import type {FpParsedTransaction} from './fpParsedTransaction';
import fpImportLogRaw from './fpImportLogRaw';
import tryMapCsvRowToFpTransaction from './tryMapCsvRowToFpTransaction';

export interface FpImportMappedRow {
  readonly transaction: FpParsedTransaction;
  readonly rowIndex: number;
  readonly fileLine: number;
}

export interface FpImportCollectResult {
  readonly parsed: number;
  readonly rows: readonly FpImportMappedRow[];
  readonly logs: readonly FpImportLogEntry[];
}

function fileLineNumber(skipRows: number, hasHeader: boolean, dataIndex: number): number {
  const headerOffset = hasHeader ? 1 : 0;
  return skipRows + headerOffset + dataIndex + 1;
}

export default function collectFpImportRows(
  tableRows: readonly Record<string, string>[],
  columnMap: FpColumnMap,
  skipRows: number,
  hasHeader: boolean,
): FpImportCollectResult {
  const mapped = tableRows.map((row, index) => {
    const rowIndex = index + 1;
    const fileLine = fileLineNumber(skipRows, hasHeader, index);
    const result = tryMapCsvRowToFpTransaction(row, columnMap);
    if (!result.ok) {
      const log: FpImportLogEntry = {
        kind: FpImportLogKind.PARSE,
        rowIndex,
        fileLine,
        message: result.reason,
        raw: fpImportLogRaw(row),
      };
      return {row: undefined, log};
    }
    const mappedRow: FpImportMappedRow = {
      transaction: result.transaction,
      rowIndex,
      fileLine,
    };
    return {row: mappedRow, log: undefined};
  });
  return {
    parsed: tableRows.length,
    rows: mapped.flatMap((item) => (item.row === undefined ? [] : [item.row])),
    logs: mapped.flatMap((item) => (item.log === undefined ? [] : [item.log])),
  };
}
