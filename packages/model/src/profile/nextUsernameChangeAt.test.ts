import nextUsernameChangeAt from './nextUsernameChangeAt';

describe('nextUsernameChangeAt', () => {
  it('returns undefined when the username has never been set', () => {
    expect(nextUsernameChangeAt(undefined)).toBeUndefined();
  });

  it('returns 30 days after the last change', () => {
    expect(nextUsernameChangeAt('2026-08-01T00:00:00.000Z')).toBe('2026-08-31T00:00:00.000Z');
  });
});
