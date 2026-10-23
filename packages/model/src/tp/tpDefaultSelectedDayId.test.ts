import tpDefaultSelectedDayId from './tpDefaultSelectedDayId';

const days = [
  {id: 'd1', calendarDate: '2026-06-01'},
  {id: 'd2', calendarDate: '2026-06-02'},
  {id: 'd3', calendarDate: '2026-06-03'},
];

describe('tpDefaultSelectedDayId', () => {
  it('selects today when it matches a calendar date', () => {
    const noonUtc = Date.parse('2026-06-02T12:00:00.000Z');
    expect(tpDefaultSelectedDayId(days, 'UTC', noonUtc)).toBe('d2');
  });

  it('selects first day when today is before trip', () => {
    const before = Date.parse('2026-05-30T12:00:00.000Z');
    expect(tpDefaultSelectedDayId(days, 'UTC', before)).toBe('d1');
  });

  it('selects last day when today is after trip', () => {
    const after = Date.parse('2026-06-10T12:00:00.000Z');
    expect(tpDefaultSelectedDayId(days, 'UTC', after)).toBe('d3');
  });

  it('picks nearer day on gap inside range (tie → earlier)', () => {
    const sparse = [{id: 'a', calendarDate: '2026-06-01'}, {id: 'b', calendarDate: '2026-06-05'}];
    const gapDay = Date.parse('2026-06-03T12:00:00.000Z');
    expect(tpDefaultSelectedDayId(sparse, 'UTC', gapDay)).toBe('a');
  });

  it('returns undefined for empty day list', () => {
    expect(tpDefaultSelectedDayId([], 'UTC')).toBeUndefined();
  });
});
