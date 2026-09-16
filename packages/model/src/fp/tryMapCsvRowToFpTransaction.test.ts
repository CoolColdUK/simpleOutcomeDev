import tryMapCsvRowToFpTransaction from './tryMapCsvRowToFpTransaction';
import {FpColumnTarget} from './fpColumnTarget';

describe('tryMapCsvRowToFpTransaction', () => {
  it('explains an unparseable date', () => {
    const result = tryMapCsvRowToFpTransaction(
      {Date: 'n/a', Amount: '10'},
      {
        [FpColumnTarget.DATE]: {column: 'Date', dateFormat: 'DD/MM/YYYY'},
        [FpColumnTarget.AMOUNT]: {column: 'Amount'},
      },
    );
    expect(result).toEqual({
      ok: false,
      reason: 'Could not parse date "n/a" with format DD/MM/YYYY',
    });
  });
});
