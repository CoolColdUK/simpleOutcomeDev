import {
  TP_ACTIVITY_LOCKED_CODE,
  TP_TRIP_LOCKED_CODE,
  TpActivityLockedError,
  TpTripLockedError,
  tpThrowIfActivityLocked,
  tpThrowIfTripLocked,
} from './tpPlanLock';

describe('tpPlanLock', () => {
  it('throws trip_locked when trip is locked', () => {
    expect(() => tpThrowIfTripLocked(true)).toThrow(TpTripLockedError);
    expect(() => tpThrowIfTripLocked(true)).toThrow(expect.objectContaining({name: TP_TRIP_LOCKED_CODE}));
    expect(() => tpThrowIfTripLocked(false)).not.toThrow();
  });

  it('throws activity_locked only for activity kind', () => {
    expect(() => tpThrowIfActivityLocked('activity', true)).toThrow(TpActivityLockedError);
    expect(() => tpThrowIfActivityLocked('activity', true)).toThrow(
      expect.objectContaining({name: TP_ACTIVITY_LOCKED_CODE}),
    );
    expect(() => tpThrowIfActivityLocked('travel', true)).not.toThrow();
    expect(() => tpThrowIfActivityLocked('activity', false)).not.toThrow();
  });
});
