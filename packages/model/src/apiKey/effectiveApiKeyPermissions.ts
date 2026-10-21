import {FpResource} from '../fp/fpResource';
import type {FeatureKind} from '../space/featureKind';
import {ApiKeyAction} from './apiKeyAction';
import type {ApiKeyFpGrant} from './apiKeyPermissions';
import {ApiKeyResource} from './apiKeyResource';
import authorizeApiKeyCall from './authorizeApiKeyCall';
import featureKindForApiResource from './featureKindForApiResource';
import ownerCanAccessPod from './ownerCanAccessPod';
import type {ApiKeyOwnerAccess, ApiKeyRecord} from './apiKeyRecord';

const ACTIONS: readonly ApiKeyAction[] = [ApiKeyAction.READ, ApiKeyAction.CREATE, ApiKeyAction.UPDATE, ApiKeyAction.DELETE];

export interface EffectiveApiKeyPod {
  readonly podId: string;
  readonly featureKind: FeatureKind;
  readonly todo?: readonly ApiKeyAction[];
  readonly shopping?: readonly ApiKeyAction[];
  readonly fp?: ApiKeyFpGrant;
}

export interface EffectiveApiKeyPermissions {
  readonly principalUserId: string;
  readonly spaceId: string;
  readonly space: readonly ApiKeyAction[];
  readonly group: readonly ApiKeyAction[];
  readonly pods: readonly EffectiveApiKeyPod[];
}

function allowed(
  key: ApiKeyRecord,
  access: ApiKeyOwnerAccess,
  nowIso: string,
  resource: ApiKeyResource,
  extra: {
    readonly podId?: string;
    readonly fpResource?: FpResource;
    readonly todoTarget?: 'card' | 'column' | 'comment';
    readonly groupTarget?: 'member' | 'invite';
  },
): readonly ApiKeyAction[] {
  return ACTIONS.filter((action) =>
    authorizeApiKeyCall({
      key,
      access,
      nowIso,
      call: {spaceId: key.spaceId, resource, action, ...extra},
    }).ok,
  );
}

function fpGrant(key: ApiKeyRecord, access: ApiKeyOwnerAccess, nowIso: string, podId: string): ApiKeyFpGrant | undefined {
  const entries = Object.values(FpResource)
    .map((resource) => {
      const actions = allowed(key, access, nowIso, ApiKeyResource.FP, {podId, fpResource: resource});
      if (actions.length === 0) {
        return undefined;
      }
      return [resource, actions] as const;
    })
    .filter((entry) => entry !== undefined);
  if (entries.length === 0) {
    return undefined;
  }
  return Object.fromEntries(entries);
}

export default function effectiveApiKeyPermissions(
  key: ApiKeyRecord,
  access: ApiKeyOwnerAccess,
  nowIso: string,
): EffectiveApiKeyPermissions {
  const pods = access.pods
    .filter((pod) => ownerCanAccessPod(pod, access.spaceRole, key.ownerUserId))
    .filter((pod) => key.podIds.length === 0 || key.podIds.includes(pod.id))
    .map((pod) => {
      const todo =
        pod.feature === featureKindForApiResource(ApiKeyResource.TODO)
          ? allowed(key, access, nowIso, ApiKeyResource.TODO, {podId: pod.id, todoTarget: 'card'})
          : [];
      const shopping =
        pod.feature === featureKindForApiResource(ApiKeyResource.SHOPPING)
          ? allowed(key, access, nowIso, ApiKeyResource.SHOPPING, {podId: pod.id})
          : [];
      const fp = pod.feature === featureKindForApiResource(ApiKeyResource.FP) ? fpGrant(key, access, nowIso, pod.id) : undefined;
      return {
        podId: pod.id,
        featureKind: pod.feature,
        ...(todo.length === 0 ? {} : {todo}),
        ...(shopping.length === 0 ? {} : {shopping}),
        ...(fp === undefined ? {} : {fp}),
      };
    });
  return {
    principalUserId: key.ownerUserId,
    spaceId: key.spaceId,
    space: allowed(key, access, nowIso, ApiKeyResource.SPACE, {}),
    group: allowed(key, access, nowIso, ApiKeyResource.GROUP, {groupTarget: 'member'}),
    pods,
  };
}
