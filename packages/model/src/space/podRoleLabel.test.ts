import podRoleLabel from './podRoleLabel';
import {PodRole} from './podRole';

describe('podRoleLabel', () => {
  it('maps owner to owner', () => {
    expect(podRoleLabel(PodRole.OWNER)).toBe('owner');
  });

  it('maps admin to admin', () => {
    expect(podRoleLabel(PodRole.ADMIN)).toBe('admin');
  });

  it('maps user to user', () => {
    expect(podRoleLabel(PodRole.USER)).toBe('user');
  });
});
