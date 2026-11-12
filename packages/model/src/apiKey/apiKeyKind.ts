export enum ApiKeyKind {
  SCOPED = 'scoped',
  FULL = 'full',
}

export interface ApiKeyKindOption {
  readonly id: ApiKeyKind;
  readonly label: string;
  readonly description: string;
}

export const API_KEY_KIND_OPTIONS: readonly ApiKeyKindOption[] = [
  {
    id: ApiKeyKind.SCOPED,
    label: 'Scoped',
    description: 'Only the actions you turn on. Pods and actions added later stay off until you edit this key.',
  },
  {
    id: ApiKeyKind.FULL,
    label: 'Full access',
    description: 'Everything you can do now, and anything you gain later. It never exceeds your own access.',
  },
];

export function apiKeyKindLabel(kind: ApiKeyKind): string {
  return API_KEY_KIND_OPTIONS.find((option) => option.id === kind)?.label ?? kind;
}
