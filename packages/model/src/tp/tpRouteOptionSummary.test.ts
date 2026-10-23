import tpRouteOptionSummary from './tpRouteOptionSummary';

describe('tpRouteOptionSummary', () => {
  it('shows name and no steps when empty', () => {
    expect(tpRouteOptionSummary({name: 'Option A', isSelected: false, steps: []})).toBe('Option A · No steps');
  });

  it('marks selected route', () => {
    expect(
      tpRouteOptionSummary({
        name: 'Option A',
        isSelected: true,
        steps: [{fromPlace: 'A', toPlace: 'B'}],
      }),
    ).toBe('Option A · selected · A → B · 1 step');
  });

  it('uses location names over place text', () => {
    expect(
      tpRouteOptionSummary({
        name: 'Fast',
        isSelected: false,
        steps: [
          {fromPlace: 'ignored', fromLocationName: 'HK Airport', toLocationName: 'Shinjuku', toPlace: 'x'},
          {fromLocationName: 'Shinjuku', toLocationName: 'Hotel'},
        ],
      }),
    ).toBe('Fast · HK Airport → Hotel · 2 steps');
  });

  it('sums price when currency matches', () => {
    expect(
      tpRouteOptionSummary({
        name: 'Option A',
        isSelected: true,
        steps: [
          {costAmount: 100, costCurrency: 'HKD'},
          {costAmount: 80, costCurrency: 'HKD'},
          {costCurrency: 'HKD'},
        ],
      }),
    ).toBe('Option A · selected · 3 steps · HKD 180');
  });

  it('omits price when currencies differ', () => {
    expect(
      tpRouteOptionSummary({
        name: 'Mix',
        isSelected: false,
        steps: [
          {costAmount: 10, costCurrency: 'USD'},
          {costAmount: 20, costCurrency: 'HKD'},
        ],
      }),
    ).toBe('Mix · 2 steps');
  });

  it('formats depart and arrive on first and last step', () => {
    const summary = tpRouteOptionSummary({
      name: 'Option A',
      isSelected: true,
      steps: [
        {
          departAt: '2026-10-01T06:00:00.000Z',
          departTimezone: 'Asia/Hong_Kong',
          arriveAt: '2026-10-01T10:00:00.000Z',
          arriveTimezone: 'Asia/Tokyo',
        },
        {
          departAt: '2026-10-01T11:00:00.000Z',
          departTimezone: 'Asia/Tokyo',
          arriveAt: '2026-10-01T12:00:00.000Z',
          arriveTimezone: 'Asia/Tokyo',
        },
      ],
    });
    expect(summary).toContain('Option A · selected');
    expect(summary).toContain('2 steps');
    expect(summary).toMatch(/→/);
  });
});
