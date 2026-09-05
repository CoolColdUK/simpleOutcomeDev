import parseFpCurrency from './parseFpCurrency';

describe('parseFpCurrency', () => {
  it('accepts GBP', () => {
    expect(parseFpCurrency('GBP')).toBe('GBP');
  });
});
