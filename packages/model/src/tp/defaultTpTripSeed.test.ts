import {defaultTpTripCalendarDateUtc, defaultTpTripTitle} from './defaultTpTripSeed';

describe('defaultTpTripTitle', () => {
  it('uses the pod name when present', () => {
    expect(defaultTpTripTitle('  Japan 2026 ')).toBe('Japan 2026');
  });

  it('falls back to Trip when the pod name is blank', () => {
    expect(defaultTpTripTitle('   ')).toBe('Trip');
    expect(defaultTpTripTitle(null)).toBe('Trip');
  });
});

describe('defaultTpTripCalendarDateUtc', () => {
  it('formats the UTC calendar date', () => {
    expect(defaultTpTripCalendarDateUtc(new Date('2026-10-23T15:30:00.000Z'))).toBe('2026-10-23');
  });
});
