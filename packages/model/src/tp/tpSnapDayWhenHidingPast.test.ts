import tpSnapDayWhenHidingPast from './tpSnapDayWhenHidingPast';

const days = [
  {id: 'd1', calendarDate: '2026-06-01'},
  {id: 'd2', calendarDate: '2026-06-02'},
  {id: 'd3', calendarDate: '2026-06-03'},
];

describe('tpSnapDayWhenHidingPast', () => {
  it('keeps selection when day is not past', () => {
    const now = Date.parse('2026-06-02T12:00:00.000Z');
    expect(tpSnapDayWhenHidingPast(days, 'UTC', 'd3', now)).toBe('d3');
  });

  it('snaps to today when selected day is past', () => {
    const now = Date.parse('2026-06-02T12:00:00.000Z');
    expect(tpSnapDayWhenHidingPast(days, 'UTC', 'd1', now)).toBe('d2');
  });

  it('snaps to first future day when today is not on trip', () => {
    const sparse = [{id: 'a', calendarDate: '2026-06-01'}, {id: 'b', calendarDate: '2026-06-05'}];
    const now = Date.parse('2026-06-03T12:00:00.000Z');
    expect(tpSnapDayWhenHidingPast(sparse, 'UTC', 'a', now)).toBe('b');
  });

  it('snaps to last day when whole trip is past', () => {
    const now = Date.parse('2026-06-10T12:00:00.000Z');
    expect(tpSnapDayWhenHidingPast(days, 'UTC', 'd1', now)).toBe('d3');
  });
});
