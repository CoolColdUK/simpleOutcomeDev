import tpStayTimelinePinsForDay from './tpStayTimelinePinsForDay';

describe('tpStayTimelinePinsForDay', () => {
  const tripTimezone = 'UTC';

  it('check-in day is bottom only', () => {
    expect(
      tpStayTimelinePinsForDay({
        calendarDate: '2026-06-01',
        checkInAt: '2026-06-01T14:00:00.000Z',
        checkOutAt: '2026-06-03T18:00:00.000Z',
        tripTimezone,
      }),
    ).toEqual(['bottom']);
  });

  it('check-out day is top only even when checkout is afternoon', () => {
    expect(
      tpStayTimelinePinsForDay({
        calendarDate: '2026-06-03',
        checkInAt: '2026-06-01T10:00:00.000Z',
        checkOutAt: '2026-06-03T18:00:00.000Z',
        tripTimezone,
      }),
    ).toEqual(['top']);
  });

  it('middle day is top and bottom', () => {
    expect(
      tpStayTimelinePinsForDay({
        calendarDate: '2026-06-02',
        checkInAt: '2026-06-01T10:00:00.000Z',
        checkOutAt: '2026-06-03T18:00:00.000Z',
        tripTimezone,
      }),
    ).toEqual(['top', 'bottom']);
  });

  it('same civil day is flow only', () => {
    expect(
      tpStayTimelinePinsForDay({
        calendarDate: '2026-06-01',
        checkInAt: '2026-06-01T10:00:00.000Z',
        checkOutAt: '2026-06-01T18:00:00.000Z',
        tripTimezone,
      }),
    ).toEqual(['flow']);
  });
});
