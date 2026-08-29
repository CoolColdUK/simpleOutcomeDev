import {PodRole} from './podRole';

export default function podRoleLabel(role: PodRole): string {
  if (role === PodRole.OWNER) {
    return 'owner';
  }
  if (role === PodRole.ADMIN) {
    return 'admin';
  }
  return 'user';
}
