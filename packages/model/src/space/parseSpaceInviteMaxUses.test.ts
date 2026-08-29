import parseSpaceInviteMaxUses from './parseSpaceInviteMaxUses';

describe('parseSpaceInviteMaxUses', () => {
  it('accepts one', () => {
    expect(parseSpaceInviteMaxUses('1')).toBe(1);
  });

  it('accepts the maximum', () => {
    expect(parseSpaceInviteMaxUses(9999)).toBe(9999);
  });

  it('rejects zero', () => {
    expect(() => parseSpaceInviteMaxUses(0)).toThrow();
  });

  it('rejects more than 9999', () => {
    expect(() => parseSpaceInviteMaxUses(10000)).toThrow();
  });
});
