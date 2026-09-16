import previewFpMappedField from './previewFpMappedField';
import {FpAmountSign} from './fpAmountSign';
import {FpColumnTarget} from './fpColumnTarget';

describe('previewFpMappedField', () => {
  it('skips empty amount cells then applies the sign function', () => {
    expect(
      previewFpMappedField(
        [{Amount: ''}, {Amount: '10'}],
        FpColumnTarget.AMOUNT,
        {column: 'Amount', sign: FpAmountSign.INVERT},
      ),
    ).toBe('-10');
  });

  it('parses the first valid date using the mapped format', () => {
    expect(
      previewFpMappedField(
        [{Date: 'n/a'}, {Date: '02/03/2025'}],
        FpColumnTarget.DATE,
        {column: 'Date', dateFormat: 'DD/MM/YYYY'},
      ),
    ).toBe('2025-03-02');
  });

  it('returns undefined when the field is not linked', () => {
    expect(previewFpMappedField([{Name: 'Shop'}], FpColumnTarget.DESCRIPTION, undefined)).toBeUndefined();
  });
});
