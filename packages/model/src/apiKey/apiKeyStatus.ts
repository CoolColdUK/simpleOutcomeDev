export enum ApiKeyStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

export type ApiKeyStoredStatus = 'active' | 'revoked';
