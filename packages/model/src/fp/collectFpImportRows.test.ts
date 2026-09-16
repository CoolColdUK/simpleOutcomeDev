import collectFpImportRows from './collectFpImportRows';
import {FpColumnTarget} from './fpColumnTarget';
import {FpImportLogKind} from './fpImportLogKind';

describe('collectFpImportRows', () => {
  it('logs parse failures and keeps valid rows', () => {
    const result = collectFpImportRows(
      [
        {Date: 'n/a', Amount: '10'},
        {Date: '02/03/2025', Amount: '4'},
      ],
      {
        [FpColumnTarget.DATE]: {column: 'Date', dateFormat: 'DD/MM/YYYY'},
        [FpColumnTarget.AMOUNT]: {column: 'Amount'},
      },
      0,
      true,
    );
    expect(result.parsed).toBe(2);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.transaction.amount).toBe(4);
    expect(result.logs).toEqual([
      {
        kind: FpImportLogKind.PARSE,
        rowIndex: 1,
        fileLine: 2,
        message: 'Could not parse date "n/a" with format DD/MM/YYYY',
        raw: '{"Date":"n/a","Amount":"10"}',
      },
    ]);
  });
});
