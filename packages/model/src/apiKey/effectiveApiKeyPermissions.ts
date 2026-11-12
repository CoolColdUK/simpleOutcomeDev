import {FpResource} from '../fp/fpResource';
import type {FeatureKind} from '../space/featureKind';
import {ApiKeyAction} from './apiKeyAction';
import {ApiKeyKind} from './apiKeyKind';
import type {ApiKeyFpGrant} from './apiKeyPermissions';
import {ApiKeyResource} from './apiKeyResource';
import authorizeApiKeyCall from './authorizeApiKeyCall';
import featureKindForApiResource from './featureKindForApiResource';
import ownerCanAccessPod from './ownerCanAccessPod';
import type {ApiKeyOwnerAccess, ApiKeyRecord} from './apiKeyRecord';

const ACTIONS: readonly ApiKeyAction[] = [ApiKeyAction.READ, ApiKeyAction.CREATE, ApiKeyAction.UPDATE, ApiKeyAction.DELETE];

export interface EffectiveApiKeySpaceAccess {
  readonly spaceId: string;
  readonly access: ApiKeyOwnerAccess;
}

export interface EffectiveApiKeyPod {
  readonly podId: string;
  readonly spaceId: string;
  readonly featureKind: FeatureKind;
  readonly todo?: readonly ApiKeyAction[];
  readonly fp?: ApiKeyFpGrant;
  readonly trip?: readonly ApiKeyAction[];
  readonly book?: readonly ApiKeyAction[];
}

export interface EffectiveApiKeySpace {
  readonly spaceId: string;
  readonly space: readonly ApiKeyAction[];
  readonly group: readonly ApiKeyAction[];
}

export interface EffectiveApiKeyPermissions {
  readonly principalUserId: string;
  readonly profile?: readonly ApiKeyAction[];
  readonly spaces: readonly EffectiveApiKeySpace[];
  readonly pods: readonly EffectiveApiKeyPod[];
}

function allowed(
  key: ApiKeyRecord,
  spaceId: string,
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
      call: {spaceId, resource, action, ...extra},
    }).ok,
  );
}

function fpGrant(key: ApiKeyRecord, spaceId: string, access: ApiKeyOwnerAccess, nowIso: string, podId: string): ApiKeyFpGrant | undefined {
  const entries = Object.values(FpResource).map((resource) => {
      const actions = allowed(key, spaceId, access, nowIso, ApiKeyResource.FP, {podId, fpResource: resource});
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

function podsFor(key: ApiKeyRecord, spaceId: string, access: ApiKeyOwnerAccess, nowIso: string): readonly EffectiveApiKeyPod[] {
  return access.pods
    .filter((pod) => ownerCanAccessPod(pod, access.spaceRole, key.ownerUserId))
    .filter((pod) => key.kind === ApiKeyKind.FULL || key.permissions.pods?.[pod.id] !== undefined)
    .flatMap((pod) => {
      const todo =
        pod.feature === featureKindForApiResource(ApiKeyResource.TODO)
          ? allowed(key, spaceId, access, nowIso, ApiKeyResource.TODO, {podId: pod.id, todoTarget: 'card'})
          : [];
      const fp = pod.feature === featureKindForApiResource(ApiKeyResource.FP) ? fpGrant(key, spaceId, access, nowIso, pod.id) : undefined;
      const trip =
        pod.feature === featureKindForApiResource(ApiKeyResource.TRIP)
          ? allowed(key, spaceId, access, nowIso, ApiKeyResource.TRIP, {podId: pod.id})
          : [];
      const book =
        pod.feature === featureKindForApiResource(ApiKeyResource.BOOK)
          ? allowed(key, spaceId, access, nowIso, ApiKeyResource.BOOK, {podId: pod.id})
          : [];
      if (todo.length === 0 && fp === undefined && trip.length === 0 && book.length === 0) {
        return [];
      }
      return [
        {
          podId: pod.id,
          spaceId,
          featureKind: pod.feature,
          ...(todo.length === 0 ? {} : {todo}),
          ...(fp === undefined ? {} : {fp}),
          ...(trip.length === 0 ? {} : {trip}),
          ...(book.length === 0 ? {} : {book}),
        },
      ];
    });
}

export default function effectiveApiKeyPermissions(
  key: ApiKeyRecord,
  spaces: readonly EffectiveApiKeySpaceAccess[],
  nowIso: string,
): EffectiveApiKeyPermissions {
  const sections = spaces.flatMap((item) => {
    const pods = podsFor(key, item.spaceId, item.access, nowIso);
    const space = allowed(key, item.spaceId, item.access, nowIso, ApiKeyResource.SPACE, {});
    const group = allowed(key, item.spaceId, item.access, nowIso, ApiKeyResource.GROUP, {groupTarget: 'member'});
    if (space.length === 0 && group.length === 0 && pods.length === 0) {
      return [];
    }
    return [{spaceId: item.spaceId, space, group, pods}];
  });
  const storedProfile = key.kind === ApiKeyKind.FULL ? [ApiKeyAction.READ, ApiKeyAction.UPDATE] : (key.permissions.profile ?? []);
  const profile = storedProfile.filter((action) => action === ApiKeyAction.READ || action === ApiKeyAction.UPDATE);
  return {
    principalUserId: key.ownerUserId,
    ...(profile.length === 0 ? {} : {profile}),
    spaces: sections.map((section) => ({spaceId: section.spaceId, space: section.space, group: section.group})),
    pods: sections.flatMap((section) => section.pods),
  };
}
