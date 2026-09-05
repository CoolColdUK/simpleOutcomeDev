import parseFpAmount from './parseFpAmount';

describe('parseFpAmount', () => {
  it('strips commas', () => {
    expect(parseFpAmount('1,234.50')).toBe(1234.5);
  });

  it('rejects junk', () => {
    expect(parseFpAmount('abc')).toBeUndefined();
  });
});
