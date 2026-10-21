import {FpResource} from '../fp/fpResource';
import {ApiKeyAction} from './apiKeyAction';
import type {ApiKeyFpGrant, ApiKeyPermissions, ApiKeyPodGrant} from './apiKeyPermissions';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TOP_LEVEL = ['space', 'group', 'todo', 'shopping', 'contact', 'profile', 'fp', 'pods'] as const;
const POD_GRANT_KEYS = ['todo', 'shopping', 'fp'] as const;
const SPACE_FEATURE_KEYS = ['todo', 'shopping', 'fp'] as const;

export interface SafeParseApiKeyPermissions {
  readonly ok: true;
  readonly value: ApiKeyPermissions;
}

export interface SafeParseApiKeyPermissionsFailure {
  readonly ok: false;
  readonly message: string;
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function parseActions(input: unknown): readonly ApiKeyAction[] | undefined {
  if (!Array.isArray(input)) {
    return undefined;
  }
  const actions = input.filter((item): item is ApiKeyAction => Object.values(ApiKeyAction).includes(item as ApiKeyAction));
  if (actions.length !== input.length) {
    return undefined;
  }
  return actions.filter((action, index) => actions.indexOf(action) === index);
}

function parseFpGrant(input: unknown): ApiKeyFpGrant | undefined {
  if (!isRecord(input)) {
    return undefined;
  }
  const known = new Set<string>(Object.values(FpResource));
  const unknown = Object.keys(input).find((key) => !known.has(key));
  if (unknown !== undefined) {
    return undefined;
  }
  const resources = Object.values(FpResource);
  const invalid = resources.some((resource) => input[resource] !== undefined && parseActions(input[resource]) === undefined);
  if (invalid) {
    return undefined;
  }
  const entries = resources.flatMap((resource) => {
    const actions = input[resource] === undefined ? undefined : parseActions(input[resource]);
    return actions === undefined ? [] : [[resource, actions] as const];
  });
  return Object.fromEntries(entries);
}

function parsePodGrant(input: unknown): ApiKeyPodGrant | undefined {
  if (!isRecord(input)) {
    return undefined;
  }
  const unknown = Object.keys(input).find((key) => !POD_GRANT_KEYS.includes(key as (typeof POD_GRANT_KEYS)[number]));
  if (unknown !== undefined) {
    return undefined;
  }
  const todo = input.todo === undefined ? undefined : parseActions(input.todo);
  const shopping = input.shopping === undefined ? undefined : parseActions(input.shopping);
  const fp = input.fp === undefined ? undefined : parseFpGrant(input.fp);
  if ((input.todo !== undefined && todo === undefined) || (input.shopping !== undefined && shopping === undefined)) {
    return undefined;
  }
  if (input.fp !== undefined && fp === undefined) {
    return undefined;
  }
  return {
    ...(todo === undefined ? {} : {todo}),
    ...(shopping === undefined ? {} : {shopping}),
    ...(fp === undefined ? {} : {fp}),
  };
}

function spaceScoped(input: Record<string, unknown>): Pick<ApiKeyPermissions, 'space' | 'group' | 'contact' | 'profile'> | undefined {
  const space = input.space === undefined ? undefined : parseActions(input.space);
  const group = input.group === undefined ? undefined : parseActions(input.group);
  const contact = input.contact === undefined ? undefined : parseActions(input.contact);
  const profile = input.profile === undefined ? undefined : parseActions(input.profile);
  if (input.space !== undefined && space === undefined) {
    return undefined;
  }
  if (input.group !== undefined && group === undefined) {
    return undefined;
  }
  if (input.contact !== undefined && contact === undefined) {
    return undefined;
  }
  if (input.profile !== undefined && profile === undefined) {
    return undefined;
  }
  return {
    ...(space === undefined ? {} : {space}),
    ...(group === undefined ? {} : {group}),
    ...(contact === undefined ? {} : {contact}),
    ...(profile === undefined ? {} : {profile}),
  };
}

export default function safeParseApiKeyPermissions(
  input: unknown,
  podIds: readonly string[],
): SafeParseApiKeyPermissions | SafeParseApiKeyPermissionsFailure {
  if (!isRecord(input)) {
    return {ok: false, message: 'Permissions must be an object'};
  }
  const unknown = Object.keys(input).find((key) => !TOP_LEVEL.includes(key as (typeof TOP_LEVEL)[number]));
  if (unknown !== undefined) {
    return {ok: false, message: `Unknown permission key ${unknown}`};
  }
  const scoped = spaceScoped(input);
  if (scoped === undefined) {
    return {ok: false, message: 'Invalid permission actions'};
  }
  if (podIds.length === 0) {
    if (input.pods !== undefined) {
      return {ok: false, message: 'Per-pod grants require a pod allowlist'};
    }
    const todo = input.todo === undefined ? undefined : parseActions(input.todo);
    const shopping = input.shopping === undefined ? undefined : parseActions(input.shopping);
    const fp = input.fp === undefined ? undefined : parseFpGrant(input.fp);
    if ((input.todo !== undefined && todo === undefined) || (input.shopping !== undefined && shopping === undefined)) {
      return {ok: false, message: 'Invalid permission actions'};
    }
    if (input.fp !== undefined && fp === undefined) {
      return {ok: false, message: 'Invalid financial planning permissions'};
    }
    return {
      ok: true,
      value: {
        ...scoped,
        ...(todo === undefined ? {} : {todo}),
        ...(shopping === undefined ? {} : {shopping}),
        ...(fp === undefined ? {} : {fp}),
      },
    };
  }
  const stray = SPACE_FEATURE_KEYS.find((key) => input[key] !== undefined);
  if (stray !== undefined) {
    return {ok: false, message: 'Allowlisted keys keep feature actions on each pod'};
  }
  if (!isRecord(input.pods)) {
    return {ok: false, message: 'Per-pod grants are required when an allowlist is set'};
  }
  const ids = Object.keys(input.pods);
  const missing = podIds.find((podId) => input.pods !== undefined && !Object.prototype.hasOwnProperty.call(input.pods, podId));
  if (missing !== undefined || ids.length !== podIds.length) {
    return {ok: false, message: 'Each allowlisted pod needs its own grant'};
  }
  const invalidId = ids.find((podId) => !UUID.test(podId));
  if (invalidId !== undefined) {
    return {ok: false, message: 'Pod grant id is not a uuid'};
  }
  const grants = ids.map((podId) => {
    const grant = parsePodGrant((input.pods as Record<string, unknown>)[podId]);
    return grant === undefined ? undefined : ([podId, grant] as const);
  });
  if (grants.some((grant) => grant === undefined)) {
    return {ok: false, message: 'Invalid per-pod grant'};
  }
  return {
    ok: true,
    value: {
      ...scoped,
      pods: Object.fromEntries(grants.filter((grant) => grant !== undefined)),
    },
  };
}
