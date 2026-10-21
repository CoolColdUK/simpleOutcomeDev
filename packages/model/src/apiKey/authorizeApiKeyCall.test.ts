import fpDefaultPermission from '../fp/fpDefaultPermission';
import {FpResource} from '../fp/fpResource';
import {FeatureKind} from '../space/featureKind';
import {PodRole} from '../space/podRole';
import {PodStatus} from '../space/podStatus';
import {SpaceRole} from '../space/spaceRole';
import {ApiKeyAction} from './apiKeyAction';
import type {ApiKeyPermissions} from './apiKeyPermissions';
import {ApiKeyResource} from './apiKeyResource';
import type {ApiKeyOwnerAccess, ApiKeyPodAccess, ApiKeyRecord} from './apiKeyRecord';
import authorizeApiKeyCall from './authorizeApiKeyCall';
import effectiveApiKeyPermissions from './effectiveApiKeyPermissions';

const owner = '11111111-1111-4111-8111-111111111111';
const space = '22222222-2222-4222-8222-222222222222';
const spaceB = '88888888-8888-4888-8888-888888888888';
const podA = '33333333-3333-4333-8333-333333333333';
const podB = '44444444-4444-4444-8444-444444444444';
const podShop = '99999999-9999-4999-8999-999999999999';
const now = '2026-10-21T00:00:00.000Z';
const crud = [ApiKeyAction.CREATE, ApiKeyAction.READ, ApiKeyAction.UPDATE, ApiKeyAction.DELETE];

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

function key(permissions: ApiKeyPermissions, partial?: Partial<ApiKeyRecord>): ApiKeyRecord {
  return {
    id: '55555555-5555-4555-8555-555555555555',
    ownerUserId: owner,
    status: 'active',
    expiresAt: undefined,
    permissions,
    ...partial,
  };
}

function access(spaceRole: SpaceRole | undefined, pods: readonly ApiKeyPodAccess[]): ApiKeyOwnerAccess {
  return {spaceRole, pods};
}

describe('authorizeApiKeyCall', () => {
  const todoKey = key({pods: {[podA]: {todo: [ApiKeyAction.READ, ApiKeyAction.CREATE]}}});
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

  it('denies a pod that has no grant', () => {
    const result = authorizeApiKeyCall({
      key: key({pods: {[podA]: {todo: [ApiKeyAction.READ]}}}),
      access: access(SpaceRole.USER, [pod(podA, FeatureKind.TODO_LIST, PodRole.USER), pod(podB, FeatureKind.TODO_LIST, PodRole.USER)]),
      nowIso: now,
      call: {spaceId: space, podId: podB, resource: ApiKeyResource.TODO, action: ApiKeyAction.READ, todoTarget: 'card'},
    });
    expect(result).toEqual({ok: false, code: 'forbidden', message: 'API key has no grant for this pod'});
  });

  it('denies an action the pod grant does not include', () => {
    const result = authorizeApiKeyCall({
      key: key({pods: {[podA]: {todo: [ApiKeyAction.READ]}}}),
      access: member,
      nowIso: now,
      call: {spaceId: space, podId: podA, resource: ApiKeyResource.TODO, action: ApiKeyAction.CREATE, todoTarget: 'card'},
    });
    expect(result).toEqual({ok: false, code: 'forbidden', message: 'API key does not grant this action'});
  });

  it('denies every pod, space, and group call when grants are empty', () => {
    const empty = key({});
    const pods = access(SpaceRole.OWNER, [pod(podA, FeatureKind.TODO_LIST, PodRole.OWNER)]);
    const todo = authorizeApiKeyCall({
      key: empty,
      access: pods,
      nowIso: now,
      call: {spaceId: space, podId: podA, resource: ApiKeyResource.TODO, action: ApiKeyAction.READ, todoTarget: 'card'},
    });
    const spaceCall = authorizeApiKeyCall({
      key: empty,
      access: pods,
      nowIso: now,
      call: {spaceId: space, resource: ApiKeyResource.SPACE, action: ApiKeyAction.READ},
    });
    const groupCall = authorizeApiKeyCall({
      key: empty,
      access: pods,
      nowIso: now,
      call: {spaceId: space, resource: ApiKeyResource.GROUP, action: ApiKeyAction.READ, groupTarget: 'member'},
    });
    expect(todo.ok).toBe(false);
    expect(spaceCall.ok).toBe(false);
    expect(groupCall.ok).toBe(false);
  });

  it('allows one key to grant a todo pod and a shopping pod in another space', () => {
    const shared = key({
      pods: {
        [podA]: {todo: [ApiKeyAction.READ]},
        [podShop]: {shopping: [ApiKeyAction.CREATE]},
      },
    });
    const todo = authorizeApiKeyCall({
      key: shared,
      access: access(SpaceRole.USER, [pod(podA, FeatureKind.TODO_LIST, PodRole.USER)]),
      nowIso: now,
      call: {spaceId: space, podId: podA, resource: ApiKeyResource.TODO, action: ApiKeyAction.READ, todoTarget: 'card'},
    });
    const shopping = authorizeApiKeyCall({
      key: shared,
      access: access(SpaceRole.USER, [pod(podShop, FeatureKind.SHOPPING_LIST, PodRole.USER)]),
      nowIso: now,
      call: {spaceId: spaceB, podId: podShop, resource: ApiKeyResource.SHOPPING, action: ApiKeyAction.CREATE},
    });
    const otherPod = authorizeApiKeyCall({
      key: shared,
      access: access(SpaceRole.USER, [pod(podB, FeatureKind.TODO_LIST, PodRole.USER)]),
      nowIso: now,
      call: {spaceId: spaceB, podId: podB, resource: ApiKeyResource.TODO, action: ApiKeyAction.READ, todoTarget: 'card'},
    });
    expect(todo.ok).toBe(true);
    expect(shopping.ok).toBe(true);
    expect(otherPod).toEqual({ok: false, code: 'forbidden', message: 'API key has no grant for this pod'});
  });

  it('keeps a space grant inside that space', () => {
    const scoped = key({spaces: {[space]: {group: [ApiKeyAction.READ, ApiKeyAction.UPDATE]}}});
    const allowed = authorizeApiKeyCall({
      key: scoped,
      access: access(SpaceRole.OWNER, []),
      nowIso: now,
      call: {spaceId: space, resource: ApiKeyResource.GROUP, action: ApiKeyAction.UPDATE, groupTarget: 'member'},
    });
    const denied = authorizeApiKeyCall({
      key: scoped,
      access: access(SpaceRole.OWNER, []),
      nowIso: now,
      call: {spaceId: spaceB, resource: ApiKeyResource.GROUP, action: ApiKeyAction.UPDATE, groupTarget: 'member'},
    });
    expect(allowed.ok).toBe(true);
    expect(denied).toEqual({ok: false, code: 'forbidden', message: 'API key does not grant this action'});
  });

  it('denies fp transaction delete when the key grants it and the role does not', () => {
    const result = authorizeApiKeyCall({
      key: key({
        pods: {[podA]: {fp: {transaction: crud}}},
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
      key: key({pods: {[podA]: {fp: {transaction: [ApiKeyAction.READ]}}}}),
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
      key: key({pods: {[podA]: {todo: [ApiKeyAction.READ]}}}),
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

  it('allows profile read without a space membership', () => {
    const result = authorizeApiKeyCall({
      key: key({profile: [ApiKeyAction.READ]}),
      access: access(undefined, []),
      nowIso: now,
      call: {spaceId: space, resource: ApiKeyResource.PROFILE, action: ApiKeyAction.READ},
    });
    expect(result).toEqual({ok: true, principalUserId: owner});
  });

  it('denies profile update when the key only grants read', () => {
    const result = authorizeApiKeyCall({
      key: key({profile: [ApiKeyAction.READ]}),
      access: access(undefined, []),
      nowIso: now,
      call: {spaceId: space, resource: ApiKeyResource.PROFILE, action: ApiKeyAction.UPDATE},
    });
    expect(result).toEqual({ok: false, code: 'forbidden', message: 'API key does not grant this action'});
  });

  it('allows space create for a space admin and denies it for a member', () => {
    const scoped = key({spaces: {[space]: {space: [ApiKeyAction.CREATE, ApiKeyAction.READ]}}});
    const allowed = authorizeApiKeyCall({
      key: scoped,
      access: access(SpaceRole.ADMIN, []),
      nowIso: now,
      call: {spaceId: space, resource: ApiKeyResource.SPACE, action: ApiKeyAction.CREATE},
    });
    const denied = authorizeApiKeyCall({
      key: scoped,
      access: access(SpaceRole.USER, []),
      nowIso: now,
      call: {spaceId: space, resource: ApiKeyResource.SPACE, action: ApiKeyAction.CREATE},
    });
    expect(allowed.ok).toBe(true);
    expect(denied).toEqual({ok: false, code: 'forbidden', message: 'Role does not allow this action'});
  });

  it('allows pod delete for the pod owner when the key grants space delete', () => {
    const result = authorizeApiKeyCall({
      key: key({spaces: {[space]: {space: [ApiKeyAction.DELETE]}}}),
      access: access(SpaceRole.USER, [pod(podA, FeatureKind.TODO_LIST, PodRole.OWNER)]),
      nowIso: now,
      call: {spaceId: space, podId: podA, resource: ApiKeyResource.SPACE, action: ApiKeyAction.DELETE, spaceTarget: 'pod'},
    });
    expect(result).toEqual({ok: true, principalUserId: owner});
  });

  it('allows delete-all only from the delete_all create grant', () => {
    const granted = authorizeApiKeyCall({
      key: key({pods: {[podA]: {fp: {delete_all: [ApiKeyAction.CREATE]}}}}),
      access: access(SpaceRole.USER, [pod(podA, FeatureKind.FINANCIAL_PLANNING, PodRole.OWNER)]),
      nowIso: now,
      call: {
        spaceId: space,
        podId: podA,
        resource: ApiKeyResource.FP,
        action: ApiKeyAction.CREATE,
        fpResource: FpResource.DELETE_ALL,
      },
    });
    const missing = authorizeApiKeyCall({
      key: key({pods: {[podA]: {fp: {transaction: crud}}}}),
      access: access(SpaceRole.USER, [pod(podA, FeatureKind.FINANCIAL_PLANNING, PodRole.OWNER)]),
      nowIso: now,
      call: {
        spaceId: space,
        podId: podA,
        resource: ApiKeyResource.FP,
        action: ApiKeyAction.CREATE,
        fpResource: FpResource.DELETE_ALL,
      },
    });
    expect(granted.ok).toBe(true);
    expect(missing).toEqual({ok: false, code: 'forbidden', message: 'API key does not grant this action'});
  });

  it('denies group role updates for a space admin', () => {
    const result = authorizeApiKeyCall({
      key: key({spaces: {[space]: {group: [ApiKeyAction.READ, ApiKeyAction.UPDATE]}}}),
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
        pods: {[podA]: {fp: {transaction: [ApiKeyAction.READ, ApiKeyAction.DELETE]}}},
      }),
      [{spaceId: space, access: access(SpaceRole.USER, [pod(podA, FeatureKind.FINANCIAL_PLANNING, PodRole.USER)])}],
      now,
    );
    expect(result.principalUserId).toBe(owner);
    expect(result.pods).toEqual([
      {
        podId: podA,
        spaceId: space,
        featureKind: FeatureKind.FINANCIAL_PLANNING,
        fp: {transaction: [ApiKeyAction.READ]},
      },
    ]);
  });

  it('omits a pod that has no grant', () => {
    const result = effectiveApiKeyPermissions(
      key({pods: {[podA]: {todo: [ApiKeyAction.READ]}}}),
      [
        {
          spaceId: space,
          access: access(SpaceRole.USER, [pod(podA, FeatureKind.TODO_LIST, PodRole.USER), pod(podB, FeatureKind.TODO_LIST, PodRole.USER)]),
        },
      ],
      now,
    );
    expect(result.pods.map((item) => item.podId)).toEqual([podA]);
  });

  it('reports grants from more than one space', () => {
    const result = effectiveApiKeyPermissions(
      key({
        pods: {[podA]: {todo: [ApiKeyAction.READ]}, [podShop]: {shopping: [ApiKeyAction.READ]}},
        spaces: {[space]: {space: [ApiKeyAction.READ]}, [spaceB]: {group: [ApiKeyAction.READ]}},
      }),
      [
        {spaceId: space, access: access(SpaceRole.USER, [pod(podA, FeatureKind.TODO_LIST, PodRole.USER)])},
        {spaceId: spaceB, access: access(SpaceRole.USER, [pod(podShop, FeatureKind.SHOPPING_LIST, PodRole.USER)])},
      ],
      now,
    );
    expect(result.spaces).toEqual([
      {spaceId: space, space: [ApiKeyAction.READ], group: []},
      {spaceId: spaceB, space: [], group: [ApiKeyAction.READ]},
    ]);
    expect(result.pods.map((item) => item.podId)).toEqual([podA, podShop]);
  });
});
