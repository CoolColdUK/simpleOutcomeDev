import type {ApiKeyAction} from './apiKeyAction';

export interface ApiKeyFpGrant {
  readonly account?: readonly ApiKeyAction[];
  readonly category?: readonly ApiKeyAction[];
  readonly transaction?: readonly ApiKeyAction[];
  readonly parser?: readonly ApiKeyAction[];
  readonly import?: readonly ApiKeyAction[];
  readonly bill_split?: readonly ApiKeyAction[];
  readonly settings?: readonly ApiKeyAction[];
  readonly delete_all?: readonly ApiKeyAction[];
}

export interface ApiKeyPodGrant {
  readonly todo?: readonly ApiKeyAction[];
  readonly shopping?: readonly ApiKeyAction[];
  readonly fp?: ApiKeyFpGrant;
}

export interface ApiKeyPermissions {
  readonly space?: readonly ApiKeyAction[];
  readonly group?: readonly ApiKeyAction[];
  readonly todo?: readonly ApiKeyAction[];
  readonly shopping?: readonly ApiKeyAction[];
  readonly contact?: readonly ApiKeyAction[];
  readonly profile?: readonly ApiKeyAction[];
  readonly fp?: ApiKeyFpGrant;
  readonly pods?: Readonly<Record<string, ApiKeyPodGrant>>;
}
