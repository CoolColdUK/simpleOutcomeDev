import mapCsvRowToFpTransaction from './mapCsvRowToFpTransaction';
import {FpAmountSign} from './fpAmountSign';
import {FpColumnTarget} from './fpColumnTarget';

describe('mapCsvRowToFpTransaction', () => {
  it('maps and inverts the amount', () => {
    const tx = mapCsvRowToFpTransaction(
      {Date: '02/03/2025', Amount: '10', Name: 'Shop'},
      {
        [FpColumnTarget.DATE]: {column: 'Date', dateFormat: 'DD/MM/YYYY'},
        [FpColumnTarget.AMOUNT]: {column: 'Amount', sign: FpAmountSign.ALL_NEGATIVE},
        [FpColumnTarget.DESCRIPTION]: {column: 'Name'},
      },
    );
    expect(tx?.postedDate).toBe('2025-03-02');
    expect(tx?.amount).toBe(-10);
    expect(tx?.description).toBe('Shop');
  });
});
