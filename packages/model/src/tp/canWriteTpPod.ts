import {PodRole} from '../space/podRole';

export default function canWriteTpPod(podRole: PodRole | undefined, isSpaceOwner: boolean): boolean {
  if (isSpaceOwner) {
    return true;
  }
  if (podRole === undefined) {
    return false;
  }
  return podRole !== PodRole.VIEWER;
}
