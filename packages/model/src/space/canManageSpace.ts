import {SpaceRole} from './spaceRole';

export default function canManageSpace(role: SpaceRole): boolean {
  return role === SpaceRole.OWNER || role === SpaceRole.ADMIN;
}
