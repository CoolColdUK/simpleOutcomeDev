import spaceRoleLabel from './spaceRoleLabel';
import {SpaceRole} from './spaceRole';

describe('spaceRoleLabel', () => {
  it('maps owner to owner', () => {
    expect(spaceRoleLabel(SpaceRole.OWNER)).toBe('owner');
  });

  it('maps admin to admin', () => {
    expect(spaceRoleLabel(SpaceRole.ADMIN)).toBe('admin');
  });

  it('maps user to user', () => {
    expect(spaceRoleLabel(SpaceRole.USER)).toBe('user');
  });
});
