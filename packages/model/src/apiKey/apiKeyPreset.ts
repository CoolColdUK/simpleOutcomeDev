export enum ApiKeyPresetId {
  ALL_ON = 'all_on',
  ALL_OFF = 'all_off',
  ALL_READ = 'all_read',
}

export interface ApiKeyPresetOption {
  readonly id: ApiKeyPresetId;
  readonly label: string;
}

export const API_KEY_PRESET_OPTIONS: readonly ApiKeyPresetOption[] = [
  {id: ApiKeyPresetId.ALL_ON, label: 'All on'},
  {id: ApiKeyPresetId.ALL_OFF, label: 'All off'},
  {id: ApiKeyPresetId.ALL_READ, label: 'All read'},
];
