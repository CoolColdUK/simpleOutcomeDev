import parseSpaceInviteDays from './parseSpaceInviteDays';

describe('parseSpaceInviteDays', () => {
  it('accepts the default window', () => {
    expect(parseSpaceInviteDays('7')).toBe(7);
  });

  it('accepts the maximum', () => {
    expect(parseSpaceInviteDays(90)).toBe(90);
  });

  it('rejects zero', () => {
    expect(() => parseSpaceInviteDays(0)).toThrow();
  });

  it('rejects more than 90', () => {
    expect(() => parseSpaceInviteDays(91)).toThrow();
  });

  it('rejects a fraction', () => {
    expect(() => parseSpaceInviteDays('7.5')).toThrow();
  });
});
