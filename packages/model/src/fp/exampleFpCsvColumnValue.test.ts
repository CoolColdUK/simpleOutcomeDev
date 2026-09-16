import exampleFpCsvColumnValue from './exampleFpCsvColumnValue';

describe('exampleFpCsvColumnValue', () => {
  it('returns the first non-empty value when the first row is blank', () => {
    expect(
      exampleFpCsvColumnValue([{Amount: ''}, {Amount: '  '}, {Amount: '12.50'}], 'Amount'),
    ).toBe('12.50');
  });

  it('returns undefined when every row is empty', () => {
    expect(exampleFpCsvColumnValue([{Name: ''}, {Name: '  '}], 'Name')).toBeUndefined();
  });
});
