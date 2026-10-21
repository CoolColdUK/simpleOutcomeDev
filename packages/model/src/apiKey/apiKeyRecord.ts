import type {FpPermissionMatrix} from '../fp/fpPermissionMatrix';
import type {FpResource} from '../fp/fpResource';
import type {FeatureKind} from '../space/featureKind';
import type {PodRole} from '../space/podRole';
import type {PodStatus} from '../space/podStatus';
import type {SpaceRole} from '../space/spaceRole';
import type {ApiKeyAction} from './apiKeyAction';
import type {ApiKeyPermissions} from './apiKeyPermissions';
import type {ApiKeyResource} from './apiKeyResource';
import type {ApiKeyStoredStatus} from './apiKeyStatus';

export interface ApiKeyRecord {
  readonly id: string;
  readonly ownerUserId: string;
  readonly status: ApiKeyStoredStatus;
  readonly expiresAt: string | undefined;
  readonly permissions: ApiKeyPermissions;
}

export interface ApiKeyPodAccess {
  readonly id: string;
  readonly feature: FeatureKind;
  readonly status: PodStatus;
  readonly createdBy: string;
  readonly role: PodRole | undefined;
  readonly fpPermission: FpPermissionMatrix | undefined;
}

export interface ApiKeyOwnerAccess {
  readonly spaceRole: SpaceRole | undefined;
  readonly pods: readonly ApiKeyPodAccess[];
}

export type ApiKeyTodoTarget = 'card' | 'column' | 'comment';

export type ApiKeyGroupTarget = 'member' | 'invite' | 'podMember' | 'podJoin';

export type ApiKeySpaceTarget = 'record' | 'pod' | 'find';

export interface ApiKeyCall {
  readonly spaceId: string;
  readonly podId?: string;
  readonly resource: ApiKeyResource;
  readonly action: ApiKeyAction;
  readonly fpResource?: FpResource;
  readonly todoTarget?: ApiKeyTodoTarget;
  readonly groupTarget?: ApiKeyGroupTarget;
  readonly spaceTarget?: ApiKeySpaceTarget;
}
