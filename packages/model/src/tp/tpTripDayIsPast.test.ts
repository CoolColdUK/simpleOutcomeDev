import tpTripDayIsPast from './tpTripDayIsPast';

describe('tpTripDayIsPast', () => {
  const noonUtcJune2 = Date.parse('2026-06-02T12:00:00.000Z');

  it('is false for today in trip timezone', () => {
    expect(tpTripDayIsPast('2026-06-02', 'UTC', noonUtcJune2)).toBe(false);
  });

  it('is true for yesterday in trip timezone', () => {
    expect(tpTripDayIsPast('2026-06-01', 'UTC', noonUtcJune2)).toBe(true);
  });

  it('is false for tomorrow in trip timezone', () => {
    expect(tpTripDayIsPast('2026-06-03', 'UTC', noonUtcJune2)).toBe(false);
  });

  it('uses trip timezone, not UTC calendar date', () => {
    const instant = Date.parse('2026-06-01T18:00:00.000Z');
    expect(tpTripDayIsPast('2026-06-01', 'UTC', instant)).toBe(false);
    expect(tpTripDayIsPast('2026-06-01', 'Asia/Hong_Kong', instant)).toBe(true);
  });
});
