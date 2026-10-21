export enum ApiKeyPresetId {
  ALL_ON = 'all_on',
  ALL_OFF = 'all_off',
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

export const API_KEY_PRESET_OPTIONS: readonly ApiKeyPresetOption[] = [
  {id: ApiKeyPresetId.ALL_ON, label: 'All on'},
  {id: ApiKeyPresetId.ALL_OFF, label: 'All off'},
  {id: ApiKeyPresetId.TODO_READ_WRITE, label: 'Todo read and write'},
  {id: ApiKeyPresetId.TODO_READ, label: 'Todo read only'},
  {id: ApiKeyPresetId.FP_READ, label: 'Financial planning read only'},
  {id: ApiKeyPresetId.SPACE_READ, label: 'Space read only'},
  {id: ApiKeyPresetId.GROUP_READ, label: 'Group read only'},
];
