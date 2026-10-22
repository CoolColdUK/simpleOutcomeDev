import tpSpanOverlapsTripDay from './tpSpanOverlapsTripDay';

describe('tpSpanOverlapsTripDay', () => {
  it('returns true when span crosses a trip day in UTC', () => {
    const overlaps = tpSpanOverlapsTripDay(
      '2026-06-01T10:00:00.000Z',
      '2026-06-03T18:00:00.000Z',
      '2026-06-02',
      'UTC',
    );
    expect(overlaps).toBe(true);
  });

  it('returns false when span is before the day', () => {
    const overlaps = tpSpanOverlapsTripDay(
      '2026-06-01T10:00:00.000Z',
      '2026-06-01T12:00:00.000Z',
      '2026-06-05',
      'UTC',
    );
    expect(overlaps).toBe(false);
  });
});
