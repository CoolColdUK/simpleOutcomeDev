import filterAccessiblePods from '../space/filterAccessiblePods';
import type {SpaceRole} from '../space/spaceRole';
import type {ApiKeyPodAccess} from './apiKeyRecord';

export default function ownerCanAccessPod(pod: ApiKeyPodAccess, spaceRole: SpaceRole | undefined, userId: string): boolean {
  if (spaceRole === undefined) {
    return false;
  }
  return (
    filterAccessiblePods({
      pods: [pod],
      memberPodIds: pod.role === undefined ? [] : [pod.id],
      spaceRole,
      userId,
      showArchived: true,
    }).length === 1
  );
}
