import parseFpImportLogs from './parseFpImportLogs';
import {FpImportLogKind} from './fpImportLogKind';

describe('parseFpImportLogs', () => {
  it('parses valid log entries', () => {
    expect(
      parseFpImportLogs([
        {kind: FpImportLogKind.PARSE, rowIndex: 2, message: 'bad date', fileLine: 4, raw: '{"Date":"x"}'},
      ]),
    ).toEqual([
      {kind: FpImportLogKind.PARSE, rowIndex: 2, message: 'bad date', fileLine: 4, raw: '{"Date":"x"}'},
    ]);
  });

  it('treats legacy errors without kind as import errors', () => {
    expect(parseFpImportLogs([{rowIndex: 1, message: 'invalid input'}])).toEqual([
      {kind: FpImportLogKind.ERROR, rowIndex: 1, message: 'invalid input'},
    ]);
  });
});
