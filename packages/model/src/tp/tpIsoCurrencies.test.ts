import {filterTpIsoCurrencies, isTpIsoCurrencyCode} from './tpIsoCurrencies';

describe('tpIsoCurrencies', () => {
  it('matches codes case-insensitively', () => {
    expect(isTpIsoCurrencyCode('JPY')).toBe(true);
    expect(isTpIsoCurrencyCode('jpy')).toBe(true);
    expect(isTpIsoCurrencyCode('HKD')).toBe(true);
    expect(isTpIsoCurrencyCode('GBP')).toBe(true);
    expect(isTpIsoCurrencyCode('yen')).toBe(false);
    expect(isTpIsoCurrencyCode('JP')).toBe(false);
  });

  it('filters by code or name', () => {
    expect(filterTpIsoCurrencies('jp').some((c) => c.code === 'JPY')).toBe(true);
    expect(filterTpIsoCurrencies('yen').some((c) => c.code === 'JPY')).toBe(true);
    expect(filterTpIsoCurrencies('').length).toBeGreaterThan(30);
  });
});
