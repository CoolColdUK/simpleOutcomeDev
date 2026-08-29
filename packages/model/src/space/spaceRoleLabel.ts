import {SpaceRole} from './spaceRole';

export default function spaceRoleLabel(role: SpaceRole): string {
  if (role === SpaceRole.OWNER) {
    return 'owner';
  }
  if (role === SpaceRole.ADMIN) {
    return 'admin';
  }
  return 'user';
}
