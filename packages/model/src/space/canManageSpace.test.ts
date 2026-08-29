import canManageSpace from './canManageSpace';
import {SpaceRole} from './spaceRole';

describe('canManageSpace', () => {
  it('allows owner', () => {
    expect(canManageSpace(SpaceRole.OWNER)).toBe(true);
  });

  it('allows admin', () => {
    expect(canManageSpace(SpaceRole.ADMIN)).toBe(true);
  });

  it('rejects user', () => {
    expect(canManageSpace(SpaceRole.USER)).toBe(false);
  });
});
