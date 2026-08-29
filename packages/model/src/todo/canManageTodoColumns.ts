import {PodRole} from '../space/podRole';

export default function canManageTodoColumns(podRole: PodRole | undefined, isSpaceOwner: boolean): boolean {
  if (isSpaceOwner) {
    return true;
  }
  return podRole === PodRole.OWNER || podRole === PodRole.ADMIN;
}
