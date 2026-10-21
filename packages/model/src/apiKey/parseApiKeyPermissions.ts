import {FpResource} from '../fp/fpResource';
import {ApiKeyAction} from './apiKeyAction';
import type {ApiKeyFpGrant, ApiKeyPermissions, ApiKeyPodGrant, ApiKeySpaceGrant} from './apiKeyPermissions';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TOP_LEVEL = ['profile', 'pods', 'spaces'] as const;
const POD_GRANT_KEYS = ['todo', 'shopping', 'fp'] as const;
const SPACE_GRANT_KEYS = ['space', 'group'] as const;
const FP_RESOURCES = Object.values(FpResource).filter((resource) => resource !== FpResource.DELETE_ALL);

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

function parseDeleteAll(input: unknown): readonly ApiKeyAction[] | undefined {
  const actions = parseActions(input);
  if (actions === undefined || actions.length === 0 || actions.some((action) => action !== ApiKeyAction.CREATE)) {
    return undefined;
  }
  return actions;
}

function parseFpGrant(input: unknown): ApiKeyFpGrant | undefined {
  if (!isRecord(input)) {
    return undefined;
  }
  const known = new Set<string>([...FP_RESOURCES, FpResource.DELETE_ALL]);
  const unknown = Object.keys(input).find((key) => !known.has(key));
  if (unknown !== undefined) {
    return undefined;
  }
  const invalid = FP_RESOURCES.some((resource) => input[resource] !== undefined && parseActions(input[resource]) === undefined);
  if (invalid) {
    return undefined;
  }
  if (input[FpResource.DELETE_ALL] !== undefined && parseDeleteAll(input[FpResource.DELETE_ALL]) === undefined) {
    return undefined;
  }
  const entries = FP_RESOURCES.flatMap((resource) => {
    const actions = input[resource] === undefined ? undefined : parseActions(input[resource]);
    return actions === undefined ? [] : [[resource, actions] as const];
  });
  const deleteAll = input[FpResource.DELETE_ALL] === undefined ? undefined : parseDeleteAll(input[FpResource.DELETE_ALL]);
  return {
    ...Object.fromEntries(entries),
    ...(deleteAll === undefined ? {} : {[FpResource.DELETE_ALL]: deleteAll}),
  };
}

function parsePodGrant(input: unknown): ApiKeyPodGrant | undefined {
  if (!isRecord(input)) {
    return undefined;
  }
  const unknown = Object.keys(input).find((key) => !POD_GRANT_KEYS.includes(key as (typeof POD_GRANT_KEYS)[number]));
  if (unknown !== undefined) {
    return undefined;
  }
  const todo = input['todo'] === undefined ? undefined : parseActions(input['todo']);
  const shopping = input['shopping'] === undefined ? undefined : parseActions(input['shopping']);
  const fp = input['fp'] === undefined ? undefined : parseFpGrant(input['fp']);
  if ((input['todo'] !== undefined && todo === undefined) || (input['shopping'] !== undefined && shopping === undefined)) {
    return undefined;
  }
  if (input['fp'] !== undefined && fp === undefined) {
    return undefined;
  }
  return {
    ...(todo === undefined ? {} : {todo}),
    ...(shopping === undefined ? {} : {shopping}),
    ...(fp === undefined ? {} : {fp}),
  };
}

function parseSpaceGrant(input: unknown): ApiKeySpaceGrant | undefined {
  if (!isRecord(input)) {
    return undefined;
  }
  const unknown = Object.keys(input).find((key) => !SPACE_GRANT_KEYS.includes(key as (typeof SPACE_GRANT_KEYS)[number]));
  if (unknown !== undefined) {
    return undefined;
  }
  const space = input['space'] === undefined ? undefined : parseActions(input['space']);
  const group = input['group'] === undefined ? undefined : parseActions(input['group']);
  if ((input['space'] !== undefined && space === undefined) || (input['group'] !== undefined && group === undefined)) {
    return undefined;
  }
  return {
    ...(space === undefined ? {} : {space}),
    ...(group === undefined ? {} : {group}),
  };
}

function parseIdMap<T>(input: unknown, parseGrant: (value: unknown) => T | undefined): Readonly<Record<string, T>> | undefined {
  if (!isRecord(input)) {
    return undefined;
  }
  const ids = Object.keys(input);
  const invalidId = ids.find((id) => !UUID.test(id));
  if (invalidId !== undefined) {
    return undefined;
  }
  const grants = ids.map((id) => {
    const grant = parseGrant(input[id]);
    return grant === undefined ? undefined : ([id, grant] as const);
  });
  if (grants.some((grant) => grant === undefined)) {
    return undefined;
  }
  return Object.fromEntries(grants.filter((grant) => grant !== undefined));
}

export default function safeParseApiKeyPermissions(input: unknown): SafeParseApiKeyPermissions | SafeParseApiKeyPermissionsFailure {
  if (!isRecord(input)) {
    return {ok: false, message: 'Permissions must be an object'};
  }
  const unknown = Object.keys(input).find((key) => !TOP_LEVEL.includes(key as (typeof TOP_LEVEL)[number]));
  if (unknown !== undefined) {
    return {ok: false, message: `Unknown permission key ${unknown}`};
  }
  const profile = input['profile'] === undefined ? undefined : parseActions(input['profile']);
  if (input['profile'] !== undefined && (profile === undefined || profile.some((action) => action !== ApiKeyAction.READ && action !== ApiKeyAction.UPDATE))) {
    return {ok: false, message: 'Invalid profile grant'};
  }
  const pods = input['pods'] === undefined ? undefined : parseIdMap(input['pods'], parsePodGrant);
  if (input['pods'] !== undefined && pods === undefined) {
    return {ok: false, message: 'Invalid per-pod grant'};
  }
  const spaces = input['spaces'] === undefined ? undefined : parseIdMap(input['spaces'], parseSpaceGrant);
  if (input['spaces'] !== undefined && spaces === undefined) {
    return {ok: false, message: 'Invalid space grant'};
  }
  return {
    ok: true,
    value: {
      ...(profile === undefined || profile.length === 0 ? {} : {profile}),
      ...(pods === undefined ? {} : {pods}),
      ...(spaces === undefined ? {} : {spaces}),
    },
  };
}
