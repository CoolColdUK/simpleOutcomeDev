import fpDefaultPermission from '../fp/fpDefaultPermission';
import {FpResource} from '../fp/fpResource';
import {FeatureKind} from '../space/featureKind';
import {PodRole} from '../space/podRole';
import {PodStatus} from '../space/podStatus';
import {SpaceRole} from '../space/spaceRole';
import {ApiKeyAction} from './apiKeyAction';
import {ApiKeyResource} from './apiKeyResource';
import type {ApiKeyOwnerAccess, ApiKeyPodAccess, ApiKeyRecord} from './apiKeyRecord';
import authorizeApiKeyCall from './authorizeApiKeyCall';
import effectiveApiKeyPermissions from './effectiveApiKeyPermissions';

const owner = '11111111-1111-4111-8111-111111111111';
const space = '22222222-2222-4222-8222-222222222222';
const podA = '33333333-3333-4333-8333-333333333333';
const podB = '44444444-4444-4444-8444-444444444444';
const now = '2026-10-21T00:00:00.000Z';

function pod(id: string, feature: FeatureKind, role: PodRole | undefined): ApiKeyPodAccess {
  return {
    id,
    feature,
    status: PodStatus.ACTIVE,
    createdBy: owner,
    role,
    fpPermission: feature === FeatureKind.FINANCIAL_PLANNING ? fpDefaultPermission() : undefined,
  };
}

function key(partial: Partial<ApiKeyRecord> & Pick<ApiKeyRecord, 'permissions' | 'podIds'>): ApiKeyRecord {
  return {
    id: '55555555-5555-4555-8555-555555555555',
    spaceId: space,
    ownerUserId: owner,
    status: 'active',
    expiresAt: undefined,
    ...partial,
  };
}

function access(spaceRole: SpaceRole | undefined, pods: readonly ApiKeyPodAccess[]): ApiKeyOwnerAccess {
  return {spaceRole, pods};
}

describe('authorizeApiKeyCall', () => {
  const todoKey = key({podIds: [], permissions: {todo: [ApiKeyAction.READ, ApiKeyAction.CREATE]}});
  const member = access(SpaceRole.USER, [pod(podA, FeatureKind.TODO_LIST, PodRole.USER), pod(podB, FeatureKind.TODO_LIST, undefined)]);

  it('allows a live key and returns the key owner as principal', () => {
    const result = authorizeApiKeyCall({
      key: todoKey,
      access: member,
      nowIso: now,
      call: {spaceId: space, podId: podA, resource: ApiKeyResource.TODO, action: ApiKeyAction.CREATE, todoTarget: 'card'},
    });
    expect(result).toEqual({ok: true, principalUserId: owner});
  });

  it('fails a revoked key on the next call', () => {
    const first = authorizeApiKeyCall({
      key: todoKey,
      access: member,
      nowIso: now,
      call: {spaceId: space, podId: podA, resource: ApiKeyResource.TODO, action: ApiKeyAction.READ, todoTarget: 'card'},
    });
    const second = authorizeApiKeyCall({
      key: {...todoKey, status: 'revoked'},
      access: member,
      nowIso: now,
      call: {spaceId: space, podId: podA, resource: ApiKeyResource.TODO, action: ApiKeyAction.READ, todoTarget: 'card'},
    });
    expect(first.ok).toBe(true);
    expect(second).toEqual({ok: false, code: 'revoked', message: 'API key is revoked'});
  });

  it('fails an expired key', () => {
    const result = authorizeApiKeyCall({
      key: {...todoKey, expiresAt: '2026-10-20T00:00:00.000Z'},
      access: member,
      nowIso: now,
      call: {spaceId: space, podId: podA, resource: ApiKeyResource.TODO, action: ApiKeyAction.READ, todoTarget: 'card'},
    });
    expect(result).toEqual({ok: false, code: 'expired', message: 'API key is expired'});
  });

  it('treats an empty allowlist as every pod the owner can access', () => {
    const allowed = authorizeApiKeyCall({
      key: key({podIds: [], permissions: {todo: [ApiKeyAction.READ]}}),
      access: member,
      nowIso: now,
      call: {spaceId: space, podId: podA, resource: ApiKeyResource.TODO, action: ApiKeyAction.READ, todoTarget: 'card'},
    });
    const denied = authorizeApiKeyCall({
      key: key({podIds: [], permissions: {todo: [ApiKeyAction.READ]}}),
      access: member,
      nowIso: now,
      call: {spaceId: space, podId: podB, resource: ApiKeyResource.TODO, action: ApiKeyAction.READ, todoTarget: 'card'},
    });
    expect(allowed.ok).toBe(true);
    expect(denied).toEqual({ok: false, code: 'forbidden', message: 'API key owner cannot access this pod'});
  });

  it('does not imply write when the allowlist is empty', () => {
    const result = authorizeApiKeyCall({
      key: key({podIds: [], permissions: {todo: [ApiKeyAction.READ]}}),
      access: member,
      nowIso: now,
      call: {spaceId: space, podId: podA, resource: ApiKeyResource.TODO, action: ApiKeyAction.CREATE, todoTarget: 'card'},
    });
    expect(result).toEqual({ok: false, code: 'forbidden', message: 'API key does not grant this action'});
  });

  it('denies a pod that is outside the allowlist', () => {
    const allowlisted = key({
      podIds: [podA],
      permissions: {pods: {[podA]: {todo: [ApiKeyAction.READ, ApiKeyAction.CREATE]}}},
    });
    const result = authorizeApiKeyCall({
      key: allowlisted,
      access: access(SpaceRole.USER, [pod(podA, FeatureKind.TODO_LIST, PodRole.USER), pod(podB, FeatureKind.TODO_LIST, PodRole.USER)]),
      nowIso: now,
      call: {spaceId: space, podId: podB, resource: ApiKeyResource.TODO, action: ApiKeyAction.READ, todoTarget: 'card'},
    });
    expect(result).toEqual({ok: false, code: 'forbidden', message: 'API key cannot access this pod'});
  });

  it('requires a per-pod grant when the allowlist is set', () => {
    const result = authorizeApiKeyCall({
      key: key({podIds: [podA], permissions: {pods: {[podA]: {}}}}),
      access: member,
      nowIso: now,
      call: {spaceId: space, podId: podA, resource: ApiKeyResource.TODO, action: ApiKeyAction.READ, todoTarget: 'card'},
    });
    expect(result).toEqual({ok: false, code: 'forbidden', message: 'API key does not grant this action'});
  });

  it('denies fp transaction delete when the key grants it and the role does not', () => {
    const result = authorizeApiKeyCall({
      key: key({
        podIds: [],
        permissions: {fp: {transaction: [ApiKeyAction.READ, ApiKeyAction.CREATE, ApiKeyAction.UPDATE, ApiKeyAction.DELETE]}},
      }),
      access: access(SpaceRole.USER, [pod(podA, FeatureKind.FINANCIAL_PLANNING, PodRole.USER)]),
      nowIso: now,
      call: {
        spaceId: space,
        podId: podA,
        resource: ApiKeyResource.FP,
        action: ApiKeyAction.DELETE,
        fpResource: FpResource.TRANSACTION,
      },
    });
    expect(result).toEqual({ok: false, code: 'forbidden', message: 'Role does not allow this action'});
  });

  it('denies delete when the role allows it and the key does not grant it', () => {
    const result = authorizeApiKeyCall({
      key: key({podIds: [], permissions: {fp: {transaction: [ApiKeyAction.READ]}}}),
      access: access(SpaceRole.OWNER, [pod(podA, FeatureKind.FINANCIAL_PLANNING, undefined)]),
      nowIso: now,
      call: {
        spaceId: space,
        podId: podA,
        resource: ApiKeyResource.FP,
        action: ApiKeyAction.DELETE,
        fpResource: FpResource.TRANSACTION,
      },
    });
    expect(result).toEqual({ok: false, code: 'forbidden', message: 'API key does not grant this action'});
  });

  it('denies a todo action on a shopping pod', () => {
    const result = authorizeApiKeyCall({
      key: todoKey,
      access: access(SpaceRole.USER, [pod(podA, FeatureKind.SHOPPING_LIST, PodRole.USER)]),
      nowIso: now,
      call: {spaceId: space, podId: podA, resource: ApiKeyResource.TODO, action: ApiKeyAction.READ, todoTarget: 'card'},
    });
    expect(result).toEqual({ok: false, code: 'forbidden', message: 'Pod feature does not match this action'});
  });

  it('denies a key whose owner left the space', () => {
    const result = authorizeApiKeyCall({
      key: todoKey,
      access: access(undefined, []),
      nowIso: now,
      call: {spaceId: space, podId: podA, resource: ApiKeyResource.TODO, action: ApiKeyAction.READ, todoTarget: 'card'},
    });
    expect(result).toEqual({ok: false, code: 'forbidden', message: 'API key owner is not a member of this space'});
  });

  it('denies group role updates for a space admin', () => {
    const result = authorizeApiKeyCall({
      key: key({podIds: [], permissions: {group: [ApiKeyAction.READ, ApiKeyAction.UPDATE]}}),
      access: access(SpaceRole.ADMIN, []),
      nowIso: now,
      call: {spaceId: space, resource: ApiKeyResource.GROUP, action: ApiKeyAction.UPDATE, groupTarget: 'member'},
    });
    expect(result).toEqual({ok: false, code: 'forbidden', message: 'Role does not allow this action'});
  });
});

describe('effectiveApiKeyPermissions', () => {
  it('does not claim fp deletes the role matrix denies', () => {
    const result = effectiveApiKeyPermissions(
      key({
        podIds: [],
        permissions: {fp: {transaction: [ApiKeyAction.READ, ApiKeyAction.DELETE]}},
      }),
      access(SpaceRole.USER, [pod(podA, FeatureKind.FINANCIAL_PLANNING, PodRole.USER)]),
      now,
    );
    expect(result.principalUserId).toBe(owner);
    expect(result.pods).toEqual([
      {
        podId: podA,
        featureKind: FeatureKind.FINANCIAL_PLANNING,
        fp: {transaction: [ApiKeyAction.READ]},
      },
    ]);
  });

  it('omits a pod outside the allowlist', () => {
    const result = effectiveApiKeyPermissions(
      key({
        podIds: [podA],
        permissions: {pods: {[podA]: {todo: [ApiKeyAction.READ]}}},
      }),
      access(SpaceRole.USER, [pod(podA, FeatureKind.TODO_LIST, PodRole.USER), pod(podB, FeatureKind.TODO_LIST, PodRole.USER)]),
      now,
    );
    expect(result.pods.map((item) => item.podId)).toEqual([podA]);
  });
});
