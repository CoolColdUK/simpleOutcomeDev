import tpVisibleTripDayChips from './tpVisibleTripDayChips';

const days = [
  {id: 'd1', calendarDate: '2026-06-01'},
  {id: 'd2', calendarDate: '2026-06-02'},
  {id: 'd3', calendarDate: '2026-06-03'},
];

const noonJune2 = Date.parse('2026-06-02T12:00:00.000Z');

describe('tpVisibleTripDayChips', () => {
  it('returns all days when showPast is true', () => {
    expect(tpVisibleTripDayChips(days, true, 'UTC', undefined, noonJune2)).toEqual(days);
  });

  it('hides past days when showPast is false', () => {
    expect(tpVisibleTripDayChips(days, false, 'UTC', undefined, noonJune2).map((d) => d.id)).toEqual(['d2', 'd3']);
  });

  it('keeps only last day when entire trip is past', () => {
    const after = Date.parse('2026-06-10T12:00:00.000Z');
    expect(tpVisibleTripDayChips(days, false, 'UTC', undefined, after).map((d) => d.id)).toEqual(['d3']);
  });

  it('includes selected past day when anchor opens it', () => {
    const visible = tpVisibleTripDayChips(days, false, 'UTC', 'd1', noonJune2);
    expect(visible.map((d) => d.id)).toEqual(['d1', 'd2', 'd3']);
  });
});
