import {ApiKeyAction} from './apiKeyAction';
import type {ApiKeyFpGrant, ApiKeyPermissions, ApiKeyPodGrant} from './apiKeyPermissions';

export enum ApiKeyPresetId {
  TODO_READ_WRITE = 'todo_read_write',
  TODO_READ = 'todo_read',
  FP_READ = 'fp_read',
  SPACE_READ = 'space_read',
  GROUP_READ = 'group_read',
}

export interface ApiKeyPresetOption {
  readonly id: ApiKeyPresetId;
  readonly label: string;
}

const read: readonly ApiKeyAction[] = [ApiKeyAction.READ];
const crud: readonly ApiKeyAction[] = [ApiKeyAction.READ, ApiKeyAction.CREATE, ApiKeyAction.UPDATE, ApiKeyAction.DELETE];

const fpRead: ApiKeyFpGrant = {
  account: read,
  category: read,
  transaction: read,
  parser: read,
  import: read,
  bill_split: read,
  settings: read,
};

export const API_KEY_PRESET_OPTIONS: readonly ApiKeyPresetOption[] = [
  {id: ApiKeyPresetId.TODO_READ_WRITE, label: 'Todo read and write'},
  {id: ApiKeyPresetId.TODO_READ, label: 'Todo read only'},
  {id: ApiKeyPresetId.FP_READ, label: 'Financial planning read only'},
  {id: ApiKeyPresetId.SPACE_READ, label: 'Space read only'},
  {id: ApiKeyPresetId.GROUP_READ, label: 'Group read only'},
];

function presetPermissions(preset: ApiKeyPresetId): ApiKeyPermissions {
  if (preset === ApiKeyPresetId.TODO_READ_WRITE) {
    return {todo: crud};
  }
  if (preset === ApiKeyPresetId.TODO_READ) {
    return {todo: read};
  }
  if (preset === ApiKeyPresetId.FP_READ) {
    return {fp: fpRead};
  }
  if (preset === ApiKeyPresetId.SPACE_READ) {
    return {space: read};
  }
  return {group: read};
}

function podGrant(base: ApiKeyPermissions): ApiKeyPodGrant {
  return {
    ...(base.todo === undefined ? {} : {todo: base.todo}),
    ...(base.shopping === undefined ? {} : {shopping: base.shopping}),
    ...(base.fp === undefined ? {} : {fp: base.fp}),
  };
}

export default function permissionsForPreset(preset: ApiKeyPresetId, podIds: readonly string[]): ApiKeyPermissions {
  const base = presetPermissions(preset);
  if (podIds.length === 0) {
    return base;
  }
  const grant = podGrant(base);
  const pods = Object.fromEntries(podIds.map((podId) => [podId, grant]));
  return {
    ...(base.space === undefined ? {} : {space: base.space}),
    ...(base.group === undefined ? {} : {group: base.group}),
    ...(base.contact === undefined ? {} : {contact: base.contact}),
    ...(base.profile === undefined ? {} : {profile: base.profile}),
    pods,
  };
}
