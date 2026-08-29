import {PodStatus} from './podStatus';
import type {PodVisibility} from './podVisibility';
import type {FeatureKind} from './featureKind';
import {SpaceRole} from './spaceRole';

export interface AccessiblePod {
  readonly id: string;
  readonly createdBy: string;
  readonly status: PodStatus;
  readonly visibility?: PodVisibility;
  readonly feature?: FeatureKind;
}

export interface FilterAccessiblePodsInput<T extends AccessiblePod> {
  readonly pods: readonly T[];
  readonly memberPodIds: readonly string[];
  readonly spaceRole: SpaceRole;
  readonly userId: string;
  readonly showArchived: boolean;
}

export default function filterAccessiblePods<T extends AccessiblePod>(input: FilterAccessiblePodsInput<T>): readonly T[] {
  const memberIds = new Set(input.memberPodIds);
  return input.pods.filter((pod) => {
    if (pod.status === PodStatus.ARCHIVED) {
      if (!input.showArchived) {
        return false;
      }
      if (input.spaceRole === SpaceRole.OWNER) {
        return true;
      }
      return pod.createdBy === input.userId;
    }
    if (input.spaceRole === SpaceRole.OWNER) {
      return true;
    }
    return memberIds.has(pod.id);
  });
}
